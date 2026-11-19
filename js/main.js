// =========================================================
// Trésors de Tapis — animations et interactions
// GSAP + ScrollTrigger pour les animations, Lenis pour le défilement fluide
// =========================================================

const tdtStart = () => {
  const root = document.documentElement;
  // Passez à true pour couper les animations chez les visiteurs qui ont activé
  // « Réduire les animations » dans les réglages de leur ordinateur ou téléphone.
  const RESPECT_REDUCED_MOTION = false;
  const reduceMotion = RESPECT_REDUCED_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) root.classList.add('reduce-motion');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  if (!hasGsap) root.classList.remove('js');

  // -------------------------------------------------------
  // Défilement fluide (Lenis)
  // -------------------------------------------------------
  let lenis = null;
  if (hasGsap && window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -90, duration: 1.4 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  };

  // Liens d’ancre (#section) avec défilement fluide
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#contenu' ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      scrollToTarget(target);
    });
  });

  // -------------------------------------------------------
  // En-tête : verre dépoli au scroll, se cache en descendant
  // -------------------------------------------------------
  const header = document.getElementById('header');
  const toTop = document.getElementById('toTop');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 2);
    if (y < lastY - 2) header.classList.remove('is-hidden');
    toTop.classList.toggle('is-visible', y > 900);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -------------------------------------------------------
  // Menu mobile
  // -------------------------------------------------------
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    else document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // -------------------------------------------------------
  // FAQ : une seule réponse ouverte à la fois, ouverture / fermeture en douceur
  // -------------------------------------------------------
  const closeFaq = (item) => {
    const answer = item.querySelector('.faq__answer');
    if (!hasGsap || reduceMotion) { item.open = false; return; }
    gsap.to(answer, { height: 0, opacity: 0, duration: .5, ease: 'power3.inOut', overwrite: true, onComplete: () => { item.open = false; gsap.set(answer, { clearProps: 'all' }); ScrollTrigger.refresh(); } });
  };
  const openFaq = (item) => {
    const answer = item.querySelector('.faq__answer');
    item.open = true;
    if (!hasGsap || reduceMotion) return;
    gsap.fromTo(answer, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: .6, ease: 'power3.out', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
  };

  document.querySelectorAll('.faq__item').forEach((item) => {
    item.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (item.open) { closeFaq(item); return; }
      item.closest('.faq').querySelectorAll('.faq__item[open]').forEach((other) => other !== item && closeFaq(other));
      openFaq(item);
    });
  });

  // -------------------------------------------------------
  // Formulaires de demande (contact, réparation) : photos + envoi WhatsApp ou Email
  // -------------------------------------------------------
  const SERVICES = {
    reparation: 'Réparation / restauration', lavage: 'Nettoyage / lavage', expertise: 'Expertise',
    recherche: 'Achat d’un tapis', architecte: 'Projet d’architecte', collecte: 'Collecte à domicile',
  };
  const params = new URLSearchParams(location.search);

  document.querySelectorAll('form[data-demande]').forEach((form) => {
    const status = form.querySelector('.form__status');
    const wanted = params.get('service');
    if (wanted) {
      const pill = form.querySelector(`input[name="service"][value="${CSS.escape(wanted)}"]`);
      if (pill) pill.checked = true;
    }

    // --- Photos : jusqu'à 10, aperçu, suppression, glisser-déposer
    let photos = [];
    const box = form.querySelector('[data-photos]');
    if (box) {
      const max = +box.dataset.max || 10;
      const input = box.querySelector('input[type="file"]');
      const drop = box.querySelector('.photos__drop');
      const list = box.querySelector('.photos__list');
      const render = () => {
        list.querySelectorAll('img').forEach((img) => URL.revokeObjectURL(img.src));
        list.innerHTML = '';
        photos.forEach((file, i) => {
          const li = document.createElement('li');
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.alt = `Photo ${i + 1}`;
          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'photos__del';
          del.setAttribute('aria-label', `Retirer la photo ${i + 1}`);
          del.textContent = '×';
          del.addEventListener('click', () => { photos.splice(i, 1); render(); });
          li.append(img, del);
          list.append(li);
        });
        box.classList.toggle('has-photos', photos.length > 0);
        box.classList.toggle('is-full', photos.length >= max);
        drop.querySelector('strong').textContent = photos.length
          ? `${photos.length} photo${photos.length > 1 ? 's' : ''} sur ${max} — en ajouter`
          : 'Ajouter des photos';
      };
      const add = (files) => {
        const images = [...files].filter((f) => f.type.startsWith('image/'));
        const room = max - photos.length;
        photos = photos.concat(images.slice(0, Math.max(room, 0)));
        render();
        if (images.length > room) {
          status.className = 'form__status is-error';
          status.textContent = `${max} photos au maximum : les photos en trop n’ont pas été ajoutées.`;
        }
      };
      input.addEventListener('change', () => { add(input.files); input.value = ''; });
      ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
      ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
      drop.addEventListener('drop', (e) => add(e.dataTransfer.files));
    }

    // --- Message rédigé automatiquement à partir des champs
    const compose = () => {
      const service = form.dataset.service || SERVICES[form.querySelector('input[name="service"]:checked')?.value] || '';
      const lines = ['Bonjour, je vous contacte depuis le site Trésors de Tapis.', ''];
      if (service) lines.push(`Demande : ${service}`);
      let message = '';
      form.querySelectorAll('[data-label]').forEach((el) => {
        let v = '';
        if (el.tagName === 'FIELDSET') v = [...el.querySelectorAll('input:checked')].map((c) => c.value).join(', ');
        else v = (el.value || '').trim();
        if (!v) return;
        if (el.tagName === 'TEXTAREA') message = v;
        else lines.push(`${el.dataset.label} : ${v}`);
      });
      if (message) lines.push('', message);
      if (photos.length) lines.push('', `J’envoie ${photos.length} photo${photos.length > 1 ? 's' : ''} de mon tapis juste après ce message.`);
      return { service, text: lines.join('\n') };
    };

    const canSharePhotos = () => {
      try { return photos.length > 0 && !!navigator.canShare && navigator.canShare({ files: photos }); } catch (e) { return false; }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const channel = e.submitter?.dataset.channel || 'whatsapp';
      let valid = true;
      form.querySelectorAll('[required]').forEach((input) => {
        const ok = input.type === 'checkbox' ? input.checked : input.value.trim() !== '' && input.checkValidity();
        (input.closest('.field') || input.closest('.consent'))?.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      status.className = 'form__status';
      status.innerHTML = '';
      if (!valid) {
        status.textContent = 'Merci de compléter les champs obligatoires et d’accepter la mention.';
        status.classList.add('is-error');
        return;
      }

      const { service, text } = compose();
      const n = photos.length;
      const msg = document.createElement('p');
      if (channel === 'email') {
        const subject = `Demande${service ? ` — ${service}` : ''} — ${(form.elements.nom?.value || '').trim()}`;
        location.href = `mailto:contact@tresorsdetapis.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        msg.textContent = n
          ? `Votre messagerie s’ouvre avec la demande prête. Dernière étape : joignez-y vos ${n} photo${n > 1 ? 's' : ''} (trombone 📎), puis envoyez.`
          : 'Votre messagerie s’ouvre avec la demande prête : il ne reste qu’à envoyer.';
        status.append(msg);
      } else {
        window.open(`https://wa.me/33603524032?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        msg.innerHTML = '<strong>Étape 1 :</strong> WhatsApp s’ouvre avec votre demande prête — envoyez-la.';
        status.append(msg);
        if (n) {
          const step = document.createElement('p');
          if (canSharePhotos()) {
            step.innerHTML = `<strong>Étape 2 :</strong> revenez ici et envoyez vos ${n} photo${n > 1 ? 's' : ''} : choisissez WhatsApp, puis la conversation « Tapis du Luxembourg ».`;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn--gold form__share';
            btn.textContent = `Envoyer mes ${n} photo${n > 1 ? 's' : ''}`;
            btn.addEventListener('click', () => {
              navigator.share({ files: photos }).catch(() => {});
            });
            status.append(step, btn);
          } else {
            step.innerHTML = `<strong>Étape 2 :</strong> dans la conversation WhatsApp, ajoutez vos ${n} photo${n > 1 ? 's' : ''} avec le trombone 📎.`;
            status.append(step);
          }
        }
      }
      status.classList.add('is-ok');
    });
  });

  // Galerie : visionneuse plein écran (clic, flèches du clavier, glisser au doigt)
  const galleryItems = [...document.querySelectorAll('.gallery__item')];
  if (galleryItems.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Visionneuse de photos');
    box.innerHTML = '<div><img alt=""><p class="lightbox__caption"></p></div>' +
      '<button class="lightbox__close" aria-label="Fermer">×</button>' +
      '<button class="lightbox__prev" aria-label="Photo précédente">←</button>' +
      '<button class="lightbox__next" aria-label="Photo suivante">→</button>';
    document.body.appendChild(box);
    const img = box.querySelector('img');
    const caption = box.querySelector('.lightbox__caption');
    let current = 0;
    const show = (i) => {
      current = (i + galleryItems.length) % galleryItems.length;
      const source = galleryItems[current].querySelector('img');
      img.src = source.dataset.full || source.currentSrc || source.src;
      img.alt = source.alt;
      caption.textContent = galleryItems[current].querySelector('figcaption')?.textContent || '';
    };
    const open = (i) => { show(i); box.classList.add('is-open'); lenis?.stop(); box.querySelector('.lightbox__close').focus(); };
    const close = () => { box.classList.remove('is-open'); lenis?.start(); };
    galleryItems.forEach((item, i) => {
      item.tabIndex = 0;
      item.addEventListener('click', () => open(i));
      item.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(i); });
    });
    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
    box.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // Icônes des valeurs : anneau dont le contour se dessine au survol
  document.querySelectorAll('.value__icon').forEach((icon) => {
    icon.insertAdjacentHTML('beforeend', '<svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="27"/></svg>');
  });

  // Menus déroulants : la photo d’aperçu change selon la ligne survolée
  document.querySelectorAll('.mega').forEach((menu) => {
    const pics = menu.querySelectorAll('.mega__preview img');
    menu.querySelectorAll('.mega__item').forEach((item, i) => {
      item.addEventListener('pointerenter', () => pics.forEach((pic, k) => pic.classList.toggle('is-active', k === i)));
    });
  });

  // Boutons : le texte « roule » au survol
  document.querySelectorAll('.btn').forEach((btn) => {
    const textNode = [...btn.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!textNode) return;
    const label = textNode.textContent.trim();
    const roll = document.createElement('span');
    roll.className = 'btn__roll';
    roll.innerHTML = '<span class="btn__roll-inner"></span>';
    roll.firstChild.textContent = label;
    roll.firstChild.dataset.text = label;
    textNode.replaceWith(roll);
  });

  // Curseur personnalisé : anneau doré qui suit la souris, « Voir » sur les images
  if (finePointer) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.innerHTML = '<span>Voir</span>';
    document.body.appendChild(cursor);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.toggle('is-visible', !e.target.closest('.header, .mobile-menu, .lightbox'));
      const t = e.target;
      cursor.classList.toggle('is-view', !!t.closest('.gallery__item, .type, [data-cursor="view"]'));
      cursor.classList.toggle('is-link', !cursor.classList.contains('is-view') && !!t.closest('a, button, summary, label'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    const loop = () => {
      cx += (mx - cx) * .18; cy += (my - cy) * .18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  // Cartes de service : le cercle sombre part de l’endroit où entre la souris
  document.querySelectorAll('.scard').forEach((card) => {
    card.addEventListener('pointerenter', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // -------------------------------------------------------
  // Transition de page : un panneau bleu nuit monte, puis se retire sur la page suivante
  // (pas d’écran d’intro à la première visite : la page s’anime directement)
  // -------------------------------------------------------
  const curtain = document.querySelector('.curtain');

  const isInternal = (a) =>
    a.origin === location.origin && !a.hash && a.target !== '_blank' &&
    !a.hasAttribute('download') && a.pathname !== location.pathname;

  // Pré-chargement de la page au survol : le changement de page est quasi instantané
  const prefetched = new Set();
  const prefetch = (a) => {
    if (!isInternal(a) || prefetched.has(a.pathname)) return;
    prefetched.add(a.pathname);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = a.pathname;
    document.head.appendChild(link);
  };

  document.querySelectorAll('a[href]').forEach((a) => {
    a.addEventListener('pointerenter', () => prefetch(a));
    a.addEventListener('touchstart', () => prefetch(a), { passive: true });
    a.addEventListener('click', (e) => {
      if (reduceMotion || e.metaKey || e.ctrlKey || e.shiftKey || !isInternal(a)) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      try { sessionStorage.setItem('tdt-nav', '1'); } catch (err) {}
      gsap.timeline({ onComplete: () => { location.href = a.href; } })
        .set(curtain, { display: 'block', scaleY: 0, transformOrigin: 'bottom' })
        .to('main', { y: -60, opacity: .4, duration: .6, ease: 'power3.in' }, 0)
        .to(curtain, { scaleY: 1, duration: .6, ease: 'expo.inOut' }, 0);
    });
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(curtain, { display: 'none' });
      gsap.set('main', { clearProps: 'opacity,transform' });
    }
  });

  const arriving = root.classList.contains('is-arriving');
  try { sessionStorage.removeItem('tdt-nav'); } catch (err) {}

  if (reduceMotion) {
    gsap.set(curtain, { display: 'none' });
    return;
  }

  if (arriving) {
    gsap.timeline()
      .set(curtain, { display: 'block', scaleY: 1, transformOrigin: 'top' })
      .to(curtain, { scaleY: 0, duration: .8, ease: 'expo.inOut', delay: .05 })
      .add(() => { root.classList.remove('is-arriving'); gsap.set(curtain, { display: 'none', clearProps: 'transform' }); })
      .add(initAnimations, .35);
  } else {
    initAnimations();
  }

  // -------------------------------------------------------
  // Toutes les animations au défilement
  // -------------------------------------------------------
  function initAnimations() {
    // Titres : les mots montent un par un
    document.querySelectorAll('[data-split]').forEach((el) => {
      splitWords(el);
      el.style.visibility = 'visible';
      gsap.from(el.querySelectorAll('.wi'), {
        yPercent: 110, rotate: 3, opacity: 0, filter: 'blur(6px)', duration: 1.4, ease: 'expo.out', stagger: .05,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // Texte doré qui devient noir lettre par lettre au rythme du défilement
    const css = getComputedStyle(root);
    const gold = css.getPropertyValue('--gold-light').trim();
    const ink = css.getPropertyValue('--ink').trim();
    document.querySelectorAll('[data-scrub]').forEach((el) => {
      splitChars(el);
      gsap.fromTo(el.querySelectorAll('.ch'), { color: gold }, {
        color: (i, ch) => (ch.closest('em') ? css.getPropertyValue('--gold-dark').trim() : ink),
        ease: 'none', stagger: .05,
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'bottom 45%', scrub: .8 },
      });
    });

    // Paragraphes : le texte monte ligne par ligne, derrière un masque
    document.querySelectorAll('p[data-reveal]').forEach((el) => {
      if (el.children.length || el.closest('.hero__bottom')) return; // paragraphes simples uniquement
      const original = el.innerHTML;
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map((w) => `<span class="lw">${w}</span>`).join(' ');
      const lines = [];
      let top = null;
      el.querySelectorAll('.lw').forEach((w) => {
        if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; }
        lines[lines.length - 1].push(w.textContent);
      });
      el.innerHTML = lines.map((l) => `<span class="line"><span class="line__in">${l.join(' ')}</span></span>`).join(' ');
      el.removeAttribute('data-reveal');
      gsap.set(el, { opacity: 1, y: 0 });
      gsap.from(el.querySelectorAll('.line__in'), {
        yPercent: 105, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08,
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onComplete: () => { el.innerHTML = original; },
      });
    });

    // Blocs : apparition en fondu, par vagues
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      onEnter: (batch) => gsap.fromTo(batch, { filter: 'blur(5px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: .09, overwrite: true, clearProps: 'filter' }),
    });

    // Images : dévoilement de bas en haut + léger zoom arrière
    document.querySelectorAll('[data-img]').forEach((el) => {
      const media = el.querySelector('img, video');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
      tl.to(el, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.6, ease: 'expo.inOut' });
      if (media && !media.hasAttribute('data-parallax')) tl.from(media, { scale: 1.35, duration: 2, ease: 'expo.out' }, 0);
    });

    // Héros plein écran : la photo recule doucement (effet « Ken Burns »)
    const heroImg = document.querySelector('.hero__bg img');
    if (heroImg) {
      gsap.fromTo(heroImg, { scale: 1.18 }, { scale: 1, duration: 2.8, ease: 'expo.out' });
      gsap.to(heroImg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__inner', { yPercent: -10, opacity: .6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }

    // Transitions de sections : les blocs sombres s’ouvrent en grandissant pendant le défilement
    document.querySelectorAll('[data-section]').forEach((el) => {
      gsap.fromTo(el, { clipPath: 'inset(6% 5% 0% 5% round 40px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 25%', scrub: .6 },
      });
    });

    // Parallaxe
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const amount = parseFloat(el.dataset.parallax) || 0.15;
      gsap.fromTo(el, { yPercent: -amount * 50 }, {
        yPercent: amount * 50, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Images flottantes : se déplacent plus vite que la page (effet de profondeur)
    document.querySelectorAll('[data-float]').forEach((el) => {
      gsap.to(el, {
        yPercent: (parseFloat(el.dataset.float) || -0.3) * 100, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Ornements qui tournent doucement avec le défilement
    document.querySelectorAll('[data-spin]').forEach((el) => {
      gsap.to(el, { rotate: parseFloat(el.dataset.spin) || 90, ease: 'none', scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    // Compteurs
    document.querySelectorAll('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => { el.textContent = Math.round(obj.v) + (el.dataset.suffix || ''); },
      });
    });

    // Barre de progression de lecture
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

    // Bandeaux défilants + badges qui tournent : accélèrent avec la vitesse de défilement
    const loops = [];
    document.querySelectorAll('[data-marquee]').forEach((m) => {
      const track = m.querySelector('.marquee__track');
      const base = track.innerHTML;
      // Garde-fou : si la page est masquée (largeur nulle), on ne boucle pas indéfiniment
      for (let i = 0; i < 12 && track.scrollWidth < window.innerWidth * 1.2; i++) track.innerHTML += base;
      track.innerHTML += track.innerHTML;
      const dir = m.dataset.marquee === 'reverse' ? -1 : 1;
      const tween = gsap.fromTo(track, { xPercent: dir === 1 ? 0 : -50 }, { xPercent: dir === 1 ? -50 : 0, duration: track.scrollWidth / 45, ease: 'none', repeat: -1 });
      loops.push(tween);
    });
    document.querySelectorAll('[data-rotate] svg').forEach((svg) => {
      loops.push(gsap.to(svg, { rotate: 360, duration: 18, ease: 'none', repeat: -1, transformOrigin: '50% 50%' }));
    });
    if (loops.length) {
      let direction = 1;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          direction = self.direction;
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 600, 2.5);
          loops.forEach((t) => {
            gsap.to(t, { timeScale: direction * boost, duration: .25, overwrite: true });
            gsap.to(t, { timeScale: direction, duration: 1.2, delay: .25, ease: 'power2.out' });
          });
        },
      });
    }

    // Processus : défilement horizontal épinglé (ordinateur uniquement)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px)', () => {
      document.querySelectorAll('.hscroll').forEach((section) => {
        const pin = section.querySelector('.hscroll__pin');
        const track = section.querySelector('.hscroll__track');
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, {
          x: () => -distance(), ease: 'none',
          scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        gsap.to(section.querySelector('.hscroll__bar span'), {
          scaleX: 1, ease: 'none',
          scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + distance(), scrub: 1 },
        });
        gsap.from(track.children, { opacity: 0, x: 120, stagger: .08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: section, start: 'top 70%' } });
      });
    });

    // Sommaire des guides : lien actif
    const tocLinks = document.querySelectorAll('.toc a');
    tocLinks.forEach((link) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target, start: 'top 40%', end: 'bottom 40%',
        onToggle: (self) => self.isActive && tocLinks.forEach((l) => l.classList.toggle('is-active', l === link)),
      });
    });

    // Boutons magnétiques
    if (finePointer) {
      document.querySelectorAll('[data-magnetic]').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: .6, ease: 'power3.out' });
        const yTo = gsap.quickTo(btn, 'y', { duration: .6, ease: 'power3.out' });
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .25);
          yTo((e.clientY - r.top - r.height / 2) * .35);
        });
        btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }

    // Vidéos : lecture uniquement quand elles sont visibles
    document.querySelectorAll('video[data-autoplay]').forEach((video) => {
      ScrollTrigger.create({
        trigger: video, start: 'top 85%', end: 'bottom 15%',
        onToggle: (self) => (self.isActive ? video.play().catch(() => {}) : video.pause()),
      });
    });

    // La section épinglée allonge la page : on recalcule toutes les positions dans l’ordre de la page
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    // Recalcul quand les images et polices sont chargées
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }

  // Découpe un texte en lettres (regroupées par mot pour ne pas couper les mots en fin de ligne)
  function splitChars(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            word.style.whiteSpace = 'nowrap';
            [...part].forEach((letter) => {
              const ch = document.createElement('span');
              ch.className = 'ch';
              ch.textContent = letter;
              word.appendChild(ch);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }

  // Découpe un titre en mots, en conservant <em>, <br>, etc.
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
  }
};

// Sur l’aperçu protégé par un code, le site ne démarre qu’une fois le code accepté
if (window.__tdtLocked) window.addEventListener('tdt-unlock', tdtStart, { once: true });
else tdtStart();
