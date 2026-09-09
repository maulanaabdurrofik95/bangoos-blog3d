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
    function frame() {
      if (!running) return;
      pts.rotation.y += 0.0016;
      pts.rotation.x += 0.0006;
      pts2.rotation.y -= 0.001;
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
