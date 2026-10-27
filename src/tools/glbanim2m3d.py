#!/usr/bin/env python3
# GLB animato (Meshy, con scheletro) -> M3D animato: la mesh viene "cotta" in pose per ogni fotogramma.
# Uso: python3 src/tools/glbanim2m3d.py file.glb <nome> m3d_<nome>.js "walk=Walking:8,idle=Walking@pose:1,atk=Spartan_Kick:6"
#   ogni voce: <nome_anim_gioco>=<nome_anim_glb>:<n_fotogrammi>   (idle con @pose = posa a gambe unite presa dalla camminata)
import json, struct, sys, io, base64
import numpy as np
from PIL import Image

def quat_to_mat(q):
    x, y, z, w = q; n = x*x + y*y + z*z + w*w; s = 2.0 / n if n else 0
    return np.array([[1 - s*(y*y + z*z), s*(x*y - z*w), s*(x*z + y*w)],
                     [s*(x*y + z*w), 1 - s*(x*x + z*z), s*(y*z - x*w)],
                     [s*(x*z - y*w), s*(y*z + x*w), 1 - s*(x*x + y*y)]])

def slerp(a, b, t):
    d = np.dot(a, b)
    if d < 0: b = -b; d = -d
    if d > 0.9995: r = a + (b - a) * t; return r / np.linalg.norm(r)
    th = np.arccos(d); return (np.sin((1 - t) * th) * a + np.sin(t * th) * b) / np.sin(th)

def load(path):
    f = open(path, 'rb'); f.read(12)
    L, _ = struct.unpack('<II', f.read(8)); j = json.loads(f.read(L))
    L2, _ = struct.unpack('<II', f.read(8)); binv = memoryview(f.read(L2))
    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]
        nc = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0); stride = bv.get('byteStride')
        if stride and stride != np.dtype(dt).itemsize * nc:
            raw = np.frombuffer(binv, dtype=np.uint8, count=stride * a['count'], offset=off).reshape(a['count'], stride)
            arr = raw[:, :np.dtype(dt).itemsize * nc].copy().view(dt).reshape(a['count'], nc)
        else:
            arr = np.frombuffer(binv, dtype=dt, count=a['count'] * nc, offset=off).reshape(-1, nc)
        if a.get('normalized') and dt != np.float32: arr = arr.astype(np.float32) / np.iinfo(dt).max
        return arr if nc > 1 else arr.reshape(-1)
    return j, binv, acc

def main(src, name, out, spec):
    j, binv, acc = load(src)
    nodes = j['nodes']; mesh_node = next(i for i, n in enumerate(nodes) if 'mesh' in n and 'skin' in n)
    prim = j['meshes'][nodes[mesh_node]['mesh']]['primitives'][0]; at = prim['attributes']
    P = acc(at['POSITION']).astype(np.float64); NN = acc(at['NORMAL']).astype(np.float64); UV = acc(at['TEXCOORD_0']).astype(np.float32)
    JO = acc(at['JOINTS_0']).astype(np.int64); WE = acc(at['WEIGHTS_0']).astype(np.float64); WE /= np.maximum(1e-9, WE.sum(1, keepdims=True))
    IDX = acc(prim['indices']).astype(np.int64)
    skin = j['skins'][nodes[mesh_node]['skin']]; joints = skin['joints']; IBM = acc(skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []): parent[c] = i
    rest = [(np.array(n.get('translation', [0, 0, 0]), float), np.array(n.get('rotation', [0, 0, 0, 1]), float), np.array(n.get('scale', [1, 1, 1]), float)) for n in nodes]
    anims = {a['name']: a for a in j['animations']}
    hips = next((i for i, n in enumerate(nodes) if n.get('name', '').endswith('Hips')), None)

    def sample(anim, t):
        T = {i: list(r) for i, r in enumerate(rest)}
        for ch in anim['channels']:
            s = anim['samplers'][ch['sampler']]; ti = acc(s['input']); vo = acc(s['output']); nd = ch['target']['node']; path = ch['target']['path']
            k = int(np.searchsorted(ti, t, 'right') - 1); k = max(0, min(k, len(ti) - 1)); k2 = min(k + 1, len(ti) - 1)
            u = 0 if k2 == k else (t - ti[k]) / (ti[k2] - ti[k]); u = min(1, max(0, u))
            if path == 'rotation': v = slerp(vo[k].astype(float), vo[k2].astype(float), u)
            else: v = vo[k] * (1 - u) + vo[k2] * u
            T[nd][{'translation': 0, 'rotation': 1, 'scale': 2}[path]] = np.array(v, float)
        if hips is not None: T[hips][0] = np.array([rest[hips][0][0], T[hips][0][1], rest[hips][0][2]])  # cammina sul posto
        G = {}
        def glob(i):
            if i in G: return G[i]
            t_, r_, s_ = T[i]; M = np.eye(4); M[:3, :3] = quat_to_mat(r_) * s_; M[:3, 3] = t_
            G[i] = glob(parent[i]) @ M if i in parent else M; return G[i]
        J = np.stack([glob(jn) @ IBM[k] for k, jn in enumerate(joints)])
        Mv = np.einsum('vk,vkij->vij', WE, J[JO])
        p = np.einsum('vij,vj->vi', Mv[:, :3, :3], P) + Mv[:, :3, 3]
        n = np.einsum('vij,vj->vi', Mv[:, :3, :3], NN); n /= np.maximum(1e-9, np.linalg.norm(n, axis=1, keepdims=True))
        foot = None
        names = [nodes[jn].get('name', '') for jn in joints]
        lf = next((k for k, x in enumerate(names) if x.endswith('LeftFoot')), None); rf = next((k for k, x in enumerate(names) if x.endswith('RightFoot')), None)
        if lf is not None and rf is not None: foot = np.linalg.norm((glob(joints[lf]) [:3, 3] - glob(joints[rf])[:3, 3])[[0, 2]])
        return p, n, foot

    frames = {}
    for item in spec.split(','):
        key, rhs = item.split('='); an, cnt = rhs.split(':'); cnt = int(cnt); pose = an.endswith('@pose'); an = an.replace('@pose', '')
        a = anims[an]; dur = max(float(acc(s['input']).max()) for s in a['samplers'])
        if pose:
            best = min((sample(a, dur * i / 24) for i in range(24)), key=lambda r: r[2] if r[2] is not None else 0); frames[key] = [best[:2]]
        else:
            frames[key] = [sample(a, dur * i / cnt)[:2] for i in range(cnt)]
        print(key, an, len(frames[key]), 'fotogrammi')
    allp = np.concatenate([p for fl in frames.values() for p, _ in fl])
    mn = allp.min(0); size = np.maximum(1e-6, allp.max(0) - mn)
    for fl in frames.values():  # appoggia i piedi a terra: stessa base per tutti
        pass
    b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    def qp(p): return np.round((p - mn) / size * 65535).astype(np.uint16)
    def qn(n): o = np.zeros((len(n), 4), np.int8); o[:, :3] = np.round(n * 127).astype(np.int8); return o
    mat = j['materials'][prim.get('material', 0)]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']
    img = j['images'][j['textures'][ti]['source']]; bv = j['bufferViews'][img['bufferView']]
    tex = Image.open(io.BytesIO(bytes(binv[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]))).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    bb = io.BytesIO(); tex.save(bb, 'JPEG', quality=82, optimize=True)
    # varianti di colore: i verdi della texture (mantello, calzoni) diventano un altro colore
    texv = {}
    for v in VARIANTS:
        nm, hue, sm, vm = v.split(':'); hue, sm, vm = float(hue), float(sm), float(vm)
        hsv = np.array(tex.convert('HSV')).astype(np.float32); H = hsv[..., 0] * 360 / 255
        w = np.clip(1 - np.abs(H - 125) / 55, 0, 1) * np.clip((hsv[..., 1] - 25) / 40, 0, 1)
        nh = (hue % 360) * 255 / 360
        hsv[..., 0] = np.where(w > 0, nh, hsv[..., 0]); hsv[..., 1] = hsv[..., 1] * (1 - w) + np.clip(hsv[..., 1] * sm, 0, 255) * w; hsv[..., 2] = hsv[..., 2] * (1 - w) + np.clip(hsv[..., 2] * vm, 0, 255) * w
        rec = Image.fromarray(hsv.astype(np.uint8), 'HSV').convert('RGB'); bv2 = io.BytesIO(); rec.save(bv2, 'JPEG', quality=80, optimize=True)
        texv[nm] = 'data:image/jpeg;base64,' + base64.b64encode(bv2.getvalue()).decode()
    uv = np.round(np.clip(UV, 0, 1) * 65535).astype(np.uint16)
    fr = ','.join(f"{k}:[{','.join('{pos:' + repr(b64(qp(p))) + ',nor:' + repr(b64(qn(n))) + '}' for p, n in fl)}]" for k, fl in frames.items())
    first = next(iter(frames.values()))[0]
    js = (f"M3D.{name}={{min:{mn.tolist()},size:{size.tolist()},n:{len(P)},pos:'{b64(qp(first[0]))}',nor:'{b64(qn(first[1]))}',uv:'{b64(uv)}',idx:'{b64(IDX.astype(np.uint16))}',"
          f"frames:{{{fr}}},texv:{json.dumps(texv)},tex:'data:image/jpeg;base64,{base64.b64encode(bb.getvalue()).decode()}'}};\n")
    open(out, 'w').write(js); print(name, len(P), 'vertici', len(IDX) // 3, 'triangoli', 'KB', len(js) // 1024, 'altezza', size[1])

VARIANTS = []
if __name__ == '__main__':
    # 5° argomento facoltativo: varianti di colore "nome:tonalità:saturazione:luminosità,..." (es. "marrone:28:0.7:0.9,rosso:358:1.3:1.0")
    if len(sys.argv) > 5: VARIANTS = [x for x in sys.argv[5].split(',') if x]
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
