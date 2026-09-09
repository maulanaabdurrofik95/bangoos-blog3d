/* Three.js particle hero background — lightweight (~80 points) */
(function () {
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

    var N = 80, pos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.PointsMaterial({ color: 0x6c8cff, size: 0.09, transparent: true, opacity: 0.85 });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);
    var pts2 = new THREE.Points(geo.clone(), new THREE.PointsMaterial({ color: 0xa06cff, size: 0.05, transparent: true, opacity: 0.6 }));
    pts2.rotation.z = 1.2;
    scene.add(pts2);

    var hero = canvas.parentElement;
    function size() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    size();
    window.addEventListener('resize', size);

    var running = true, raf = 0;
    function frame() {
      if (!running) return;
      pts.rotation.y += 0.0016;
      pts.rotation.x += 0.0006;
      pts2.rotation.y -= 0.001;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); }
    function resume() { if (running) return; running = true; frame(); }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? pause() : resume();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? resume() : pause(); }).observe(hero);
    }
    frame();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
