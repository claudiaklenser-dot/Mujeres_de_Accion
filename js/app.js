(function(){
  'use strict';
  var $=function(s,r){return (r||document).querySelector(s);};
  var N=window.Novedades, D=window.Devocional, C=window.Comun, esc=C.esc, get=C.get, aviso=C.aviso;
  var estado={arts:[],dev:null,fecha:null,t:0,primera:true};
  /* Páginas que ya existen: aunque config.json marque "pronto", se abren normalmente. */
  var PAGINAS=/^(articulos|recursos|contacto|devocional|testimonio|editoras|mas)\.html/;

  /* ---------- Logo (texto editable o imagen) ---------- */
  function logo(l){
    var box=$('#logo'); l=l||{};
    function texto(){box.innerHTML='<span class="logo-1">'+esc(l.linea1)+'</span><span class="logo-2">'+esc(l.linea2)+'</span>';}
    texto();
    if(l.imagen){
      var im=new Image(); im.className='logo-img'; im.alt=(l.linea1||'')+' '+(l.linea2||'');
      im.onload=function(){box.replaceChildren(im);};
      im.src=l.imagen;
    }
  }

  /* ---------- Hero ---------- */
  /* Un color solo se aplica si es un hexadecimal válido (#RRGGBB); si no, queda el color original del diseño. */
  function colorOk(c){return (typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c))?c:'';}
  function hero(h){
    h=h||{};
    if(h.imagen) $('#hero-foto').style.backgroundImage='url("'+String(h.imagen).replace(/["\\]/g,'')+'")';
    if(h.descripcion) $('#hero-foto').setAttribute('aria-label',String(h.descripcion));
    $('#hero-frase').textContent=h.frasePrincipal||'';
    $('#hero-sub').textContent=h.fraseSecundaria||'';
    var c1=colorOk(h.colorPrincipal), c2=colorOk(h.colorSecundaria);
    if(c1) $('#hero-frase').style.color=c1;
    if(c2) $('#hero-sub').style.color=c2;
  }

  /* ---------- Tarjetas ---------- */
  function img(src){return src?'<img src="'+esc(src)+'" alt="" loading="lazy" onerror="this.remove()">':'';}
  function resumenTexto(obj){
    return C.lista(obj).filter(function(p){return !/^##\s/.test(String(p));}).slice(0,3).map(function(p){return '<p>'+C.conSaltos(C.limpiar(p))+'</p>';}).join('');
  }
  function tarjetaResumen(o){
    return '<article class="tarjeta '+o.clase+'">'+
      '<div class="tarjeta-img">'+img(o.imagen)+'</div>'+
      '<div class="tarjeta-cuerpo">'+
        '<div class="fila-etiqueta"><span class="etiqueta">'+esc(o.etiqueta)+'</span>'+
          (o.dev?'<span class="nuevo" data-nuevo-dev="'+esc(o.dev)+'" hidden>Nuevo</span>':'')+'</div>'+
        (o.fecha?'<time class="fecha">'+esc(o.fecha)+'</time>':'')+
        '<h3>'+esc(o.titulo)+'</h3>'+
        (o.referencia?'<p class="referencia">'+esc(o.referencia)+'</p>':'')+
        '<div class="texto-fade">'+resumenTexto(o.fuente)+'</div>'+
        '<a class="btn-leer" href="'+esc(o.href)+'"'+(o.dev?' data-marcar-dev="'+esc(o.dev)+'"':'')+'>Leer más</a>'+
      '</div></article>';
  }

  function tarjetas(test,devs,cfg){
    cfg=cfg||{};
    var html='';
    if(test) html+=tarjetaResumen({clase:'t-testimonio',etiqueta:test.etiqueta||'Testimonio',titulo:test.titulo||'Testimonio',imagen:test.imagen||'img/testimonio.webp',fuente:test,href:'testimonio.html'});
    var d=D.elegir(devs); estado.dev=d;
    if(d) html+=tarjetaResumen({clase:'t-devocional',etiqueta:(d.fecha===D.hoyISO()?'Devocional de hoy':'Último devocional'),dev:d.fecha,fecha:D.fechaLarga(d.fecha),titulo:d.titulo,referencia:d.referencia,imagen:d.imagen||(cfg.devocional&&cfg.devocional.imagen)||'img/devocional.webp',fuente:d,href:'devocional.html?fecha='+encodeURIComponent(d.fecha)});
    $('#tarjetas').innerHTML=html;
  }

  /* ---------- Carrusel ---------- */
  function carrusel(cats){
    $('#carrusel').innerHTML=(cats||[]).map(function(c){
      var href=c.href||'';
      /* La tarjeta "Más" tiene su propia pantalla (antes apuntaba a Artículos). */
      if(String(c.nombre||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()==='mas'&&/^articulos\.html/.test(href)) href='mas.html';
      var conNum=c.insignia==='articulos'||/^articulos\.html/.test(href);
      var pronto=c.pronto&&!PAGINAS.test(href);
      return '<a class="cat cat-'+esc(c.color||'verde')+(pronto?' pronto':'')+'" href="'+esc(href)+'">'+
        '<span class="cat-img">'+img(c.imagen)+'</span>'+
        (conNum?'<span class="cat-num" data-num-art hidden></span>':'')+
        '<span class="cat-pie"><span>'+esc(c.nombre)+'</span><span aria-hidden="true">→</span></span></a>';
    }).join('');
  }

  /* ---------- Artículo destacado ---------- */
  function destacado(arts){
    var a=(arts||[]).filter(function(x){return x.destacado;})[0]||(arts||[])[0];
    var box=$('#destacado');
    if(!a){box.innerHTML='';return;}
    box.innerHTML='<article class="tarjeta t-destacado">'+
      '<div class="tarjeta-img">'+img(a.imagen)+'</div>'+
      '<div class="tarjeta-cuerpo">'+
        '<div class="fila-etiqueta"><span class="etiqueta">Artículo destacado</span>'+
          '<span class="nuevo" data-nuevo-art="'+esc(a.id)+'" hidden>Nuevo</span></div>'+
        '<h3>'+esc(a.titulo)+'</h3>'+
        '<p class="resumen">'+esc(a.resumen)+'</p>'+
        '<a class="btn-leer" data-art-id="'+esc(a.id)+'" href="articulo.html?id='+encodeURIComponent(a.id)+'">Leer más</a>'+
      '</div></article>';
  }

  function revelar(){
    var els=document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('visible');});return;}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});
    },{threshold:.2});
    els.forEach(function(e){io.observe(e);});
  }

  /* ---------- Avisos "Nuevo" y número en el ícono ---------- */
  function refrescarAvisos(){
    var nDev=(estado.dev&&N.devNuevo(estado.dev.fecha))?1:0;
    var nArt=N.nuevosArt(estado.arts).length;
    document.querySelectorAll('[data-nuevo-dev]').forEach(function(el){el.hidden=!N.devNuevo(el.getAttribute('data-nuevo-dev'));});
    document.querySelectorAll('[data-nuevo-art]').forEach(function(el){el.hidden=!N.artNuevo(el.getAttribute('data-nuevo-art'));});
    document.querySelectorAll('[data-num-art]').forEach(function(el){el.textContent=nArt;el.hidden=nArt<1;});
    C.puntos({dev:nDev,art:nArt});
    N.insignia(nDev+nArt);
  }

  /* ---------- Instalación ---------- */
  var promptInst=null;
  function esStandalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;}
  function instCerrado(){try{var t=parseInt(localStorage.getItem('mda_inst_cerrado'),10);return t>1e12&&Date.now()-t<7*864e5;}catch(e){return false;}}
  function esIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);}
  function bannerInstalar(modo){
    if(esStandalone()||instCerrado()) return;
    $('#instalar').innerHTML='<div class="instalar">'+
      '<p>'+(modo==='ios'?'Instalá la app: tocá Compartir y elegí “Agregar a inicio”.':'Instalá la app en tu celular y abrila como cualquier otra.')+'</p>'+
      (modo==='android'?'<button type="button" class="btn-leer" id="btn-instalar">Instalar</button>':'')+
      '<button type="button" class="cerrar" data-cerrar-inst aria-label="Cerrar">×</button></div>';
  }
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();promptInst=e;bannerInstalar('android');});
  window.addEventListener('appinstalled',function(){promptInst=null;$('#instalar').innerHTML='';cerrarPantInst();});
  if(esIOS()&&!esStandalone()) bannerInstalar('ios');

  /* ---------- Pantalla "Último paso" ----------
     Se muestra cuando se llega desde la app vieja (la dirección trae ?desde=v1) y esta app todavía no está instalada.
     En Android, el botón abre el cartel de instalación de Chrome; si Chrome todavía no lo habilitó, explica cómo hacerlo
     desde el menú. En iPhone muestra los pasos de Safari. "Más tarde" la cierra sin recordar nada. */
  var pantInst=null;
  function cerrarPantInst(){
    if(pantInst&&pantInst.parentNode) pantInst.parentNode.removeChild(pantInst);
    pantInst=null; document.documentElement.style.overflow='';
  }
  function pantallaInstalar(){
    if(!/[?&]desde=v1/.test(location.search)||esStandalone()||pantInst) return;
    var ios=esIOS();
    var o=document.createElement('div'); pantInst=o;
    o.id='pant-instalar'; o.setAttribute('role','dialog'); o.setAttribute('aria-modal','true'); o.setAttribute('aria-labelledby','pant-inst-t');
    o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;background:#FBF7F1;color:#3b3b3b;font-family:Mulish,system-ui,sans-serif;padding:max(24px,env(safe-area-inset-top)) 24px max(24px,env(safe-area-inset-bottom))';
    var caja='margin-top:14px;padding:14px 16px;border-radius:16px;background:#fff;text-align:left;font-size:.9rem;line-height:1.5;box-shadow:0 1px 6px rgba(0,0,0,.08)';
    var h='<div style="margin:auto;width:100%;max-width:420px;text-align:center">'
      +'<div aria-hidden="true" style="font-size:2.4rem;line-height:1;margin-bottom:14px">🌿</div>'
      +'<h1 id="pant-inst-t" style="font:600 1.9rem/1.15 Cormorant Garamond,Georgia,serif;margin:0 0 12px;color:#4F6B58">Último paso: instalá la app nueva</h1>'
      +'<p style="margin:0 0 22px;font-size:1rem;line-height:1.55">Así queda en tu celular con su ícono verde y te llegan los avisos.</p>';
    if(ios){
      h+='<div style="'+caja+'"><p style="margin:0 0 8px;font-weight:700">En iPhone:</p><ol style="margin:0;padding-left:1.2em"><li>Tocá el botón Compartir.</li><li>Elegí “Agregar a inicio”.</li></ol></div>';
    }else{
      h+='<button type="button" id="pant-inst-ir" style="display:block;width:100%;min-height:54px;border:0;border-radius:999px;padding:.9em 1.2em;background:#4F6B58;color:#fff;font:800 1.02rem Mulish,system-ui,sans-serif;cursor:pointer">Instalar la app</button>'
        +'<div id="pant-inst-ayuda" style="'+caja+'"><p style="margin:0">Si no se abre el cartel de instalación: tocá el menú ⋮ de Chrome (arriba a la derecha) y elegí “Instalar app” o “Agregar a la pantalla de inicio”.</p></div>';
    }
    h+='<p style="margin:16px 0 0;font-size:.85rem;color:#6b6b6b">Si ya la instalaste, abrila desde su ícono verde.</p>'
      +'<button type="button" id="pant-inst-luego" style="margin-top:8px;border:0;background:none;padding:10px 14px;color:#6b6b6b;font:600 .9rem Mulish,system-ui,sans-serif;text-decoration:underline;cursor:pointer">Más tarde</button></div>';
    o.innerHTML=h; document.body.appendChild(o); document.documentElement.style.overflow='hidden';
    var ir=o.querySelector('#pant-inst-ir');
    if(ir) ir.addEventListener('click',function(){
      if(promptInst){
        promptInst.prompt();
        promptInst.userChoice.then(function(r){ promptInst=null; $('#instalar').innerHTML=''; if(r&&r.outcome==='accepted') cerrarPantInst(); });
      }else{
        var a=o.querySelector('#pant-inst-ayuda'); a.style.outline='2px solid #4F6B58';
      }
    });
    o.querySelector('#pant-inst-luego').addEventListener('click',cerrarPantInst);
    try{ (ir||o.querySelector('#pant-inst-luego')).focus({preventScroll:true}); }catch(e){}
  }
  pantallaInstalar();

  /* ---------- Menú ---------- */
  var bm=$('#btn-menu'), pm=$('#menu-panel');
  function cerrarMenu(){pm.hidden=true;bm.setAttribute('aria-expanded','false');}
  bm.addEventListener('click',function(e){e.stopPropagation();var abrir=pm.hidden;pm.hidden=!abrir;bm.setAttribute('aria-expanded',String(abrir));});
  document.addEventListener('click',function(e){if(!pm.hidden&&!e.target.closest('#menu-panel')) cerrarMenu();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape') cerrarMenu();});

  /* ---------- Eventos ---------- */
  document.addEventListener('click',function(e){
    var md=e.target.closest('[data-marcar-dev]');
    if(md){N.marcarDev(md.getAttribute('data-marcar-dev'));refrescarAvisos();return;}
    var l=e.target.closest('[data-art-id]');
    if(l){N.marcarArt(l.getAttribute('data-art-id'));refrescarAvisos();return;}
    if(e.target.closest('#btn-instalar')&&promptInst){
      promptInst.prompt();
      promptInst.userChoice.then(function(){promptInst=null;$('#instalar').innerHTML='';});
      return;
    }
    if(e.target.closest('[data-cerrar-inst]')){
      try{localStorage.setItem('mda_inst_cerrado',String(Date.now()));}catch(er){}
      $('#instalar').innerHTML='';
      return;
    }
    var p=e.target.closest('a.pronto,[data-pronto]');
    if(p){e.preventDefault();cerrarMenu();aviso('Esta sección llega en la próxima etapa.');}
  });
  $('#prev').addEventListener('click',function(){$('#carrusel').scrollBy({left:-$('#carrusel').clientWidth*.8,behavior:'smooth'});});
  $('#next').addEventListener('click',function(){$('#carrusel').scrollBy({left:$('#carrusel').clientWidth*.8,behavior:'smooth'});});

  /* ---------- Carga de datos ---------- */
  function ok(p){return p.status==='fulfilled'?p.value:null;}
  function cargarTodo(){
    estado.t=Date.now(); estado.fecha=D.hoyISO();
    return Promise.allSettled([get('data/config.json'),get('data/testimonio.json'),get('data/devocionales.json'),get('data/articulos.json')])
    .then(function(r){
      var cfg=ok(r[0]);
      if(!cfg){
        if(estado.primera) $('#tarjetas').innerHTML='<div class="error-carga">No se pudieron cargar los datos. Abrí la app desde GitHub Pages o con un servidor local (no directamente desde el archivo).</div>';
        return;
      }
      document.title=cfg.nombreApp||document.title;
      logo(cfg.logo); hero(cfg.hero);
      estado.arts=ok(r[3])||[];
      N.iniciar(estado.arts);
      tarjetas(ok(r[1]),ok(r[2]),cfg); carrusel(cfg.categorias); destacado(estado.arts);
      $('#pie-texto').textContent='© '+new Date().getFullYear()+' '+((cfg.pie&&cfg.pie.texto)||'');
      refrescarAvisos();
      if(estado.primera){revelar();estado.primera=false;}
    });
  }
  C.iniciarPagina('inicio');
  cargarTodo();

  /* Al volver a la app después de un rato (o si cambió el día), busca contenido nuevo. */
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='visible'&&!estado.primera&&(Date.now()-estado.t>30*60*1000||D.hoyISO()!==estado.fecha)) cargarTodo();
  });
})();
