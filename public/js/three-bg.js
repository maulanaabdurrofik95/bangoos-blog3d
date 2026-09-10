/* BangoosBlog3D — neon particle hero background
   ~80 points cyan #22d3ee + sedikit magenta · DPR cap 1.5
   pause saat tab hidden / hero offscreen · hormati reduced-motion */
(function () {
  'use strict';

  function init() {
    var canvas = document.getElementById('bg3d');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof THREE === 'undefined') return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 6;

    // Lapisan utama: ~64 titik neon cyan
    var N = 64;
    var pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x22d3ee, size: 0.085, transparent: true, opacity: 0.85
    }));
    scene.add(pts);

    // Lapisan sekunder: ~18 titik magenta, hemat, lebih kecil & redup
    var M = 18;
    var pos2 = new Float32Array(M * 3);
    for (var j = 0; j < M; j++) {
      pos2[j * 3] = (Math.random() - 0.5) * 12;
      pos2[j * 3 + 1] = (Math.random() - 0.5) * 7;
      pos2[j * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    var geo2 = new THREE.BufferGeometry();
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    var pts2 = new THREE.Points(geo2, new THREE.PointsMaterial({
      color: 0xf472b6, size: 0.05, transparent: true, opacity: 0.45
    }));
    pts2.rotation.z = 1.2;
    scene.add(pts2);

    var hero = canvas.parentElement;
    function size() {
      var w = hero.clientWidth || 1;
      var h = hero.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);

    var running = true;
    var raf = 0;
    /* objek 3D nyata: icosahedron neon + torus magenta + kubus kecil melayang */
    var ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.9, 1),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 })
    );
    ico.position.set(2.4, 0.6, -1.5);
    scene.add(ico);
    var torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.045, 10, 48),
      new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.8 })
    );
    torus.position.copy(ico.position);
    torus.rotation.x = Math.PI / 2.4;
    scene.add(torus);
    var cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.55, 0.55),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.7 })
    );
    cube.position.set(-2.6, -0.7, -1);
    scene.add(cube);
    var t = 0;
    /* maskot lokal: bebek GLB (gagal load = skip diam-diam, scene tetap jalan) */
    var duck = null;
    function loadDuck() {
      if (typeof THREE.GLTFLoader === 'undefined') {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/GLTFLoader.min.js';
        s.onload = loadDuck;
        document.head.appendChild(s);
        return;
      }
      new THREE.GLTFLoader().load('models/Duck.glb', function (g) {
        duck = g.scene;
        duck.scale.set(1.4, 1.4, 1.4);
        duck.position.set(-2.4, -0.9, -0.5);
        scene.add(duck);
      }, undefined, function () { duck = null; });
    }
    loadDuck();
    /* parallax ngikutin scroll + sentuhan jari di hero */
    var px = 0, py = 0, gx = 0, gy = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      gy = Math.min(1.2, y / 600);
    }, { passive: true });
    hero.addEventListener('pointermove', function (e) {
      var b = hero.getBoundingClientRect();
      gx = ((e.clientX - b.left) / b.width - 0.5) * 2;
    }, { passive: true });
    function frame() {
      if (!running) return;
      pts.rotation.y += 0.0016;
      pts.rotation.x += 0.0006;
      pts2.rotation.y -= 0.001;
      t += 0.012;
      ico.rotation.y += 0.008; ico.rotation.x += 0.003;
      ico.position.y = 0.6 + Math.sin(t * 1.2) * 0.18;
      torus.rotation.z += 0.006;
      torus.position.y = ico.position.y;
      cube.rotation.x += 0.006; cube.rotation.y += 0.009;
      cube.position.y = -0.7 + Math.cos(t) * 0.15;
      if (duck) { duck.rotation.y += 0.01; duck.position.y = -0.9 + Math.sin(t * 1.5) * 0.12; }
      px += (gx - px) * 0.06; py += (gy - py) * 0.06;
      camera.position.x = px * 0.9;
      camera.position.y = -py * 0.7;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function pause() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function resume() {
      if (running) return;
      running = true;
      frame();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else resume();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) resume(); else pause();
      }).observe(hero);
    }
    frame();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
