const revistas = [
  {
    title: "Las Doctrinas Bíblicas de la Salvación",
    description: "Las Doctrinas Bíblicas de la Salvación Primera Parte",
    href: "./revistas/las-doctrinas-biblicas-de-la-salvacion-1p/index.html",
    cover: "../assets/cover/LAS DOCTRINAS BIBLICAS DE LA SALVACION 1P.gif",
  },
  {
    title: "Las Doctrinas Bíblicas de la Salvación",
    description: "Las Doctrinas Bíblicas de la Salvación Segunda Parte",
    href: "./revistas/las-doctrinas-biblicas-de-la-salvacion-2p/index.html",
    cover: "../assets/cover/LAS DOCTRINAS BIBLICAS DE LA SALVACION 2P.gif",
  },
  {
    title: "¿Qué es el discipulado?",
    description: "Fundamentos del discipulado cristiano para nuevos creyentes.",
    href: "./revistas/que-es-el-discipulado/index.html",
    cover: "../assets/cover/¿QUÉ ES EL DISCÍPULADO.jpg",
  },
  {
    title: "¿Dónde está el Dios de Elías?",
    description: "Una solución para el fundamentalismo muerto.",
    href: "./revistas/donde-esta-el-Dios-de-elias/index.html",
    cover: "../assets/cover/¿DÓNDE ESTÁ EL DIOS DE ELÍAS.jpg",
  },
  {
    title: "Cristianismo Radical",
    description: "Versión preliminar.",
    href: "./revistas/cristianismo-radical/index.html",
    cover: "../assets/cover/CRISTIANISMO RADICAL.gif",
  },
  {
    title: "¿Eres Salvo o solamente Religioso?",
    description: "Versión preliminar.",
    href: "./revistas/eres-salvo-o-solamente-religioso/index.html",
    cover: "../assets/cover/Eres-salvo-o-solamente-religioso.png",
  },
 {
   title: "El Camino de Muerte",
   description: "Versión preliminar.",
   href: "./revistas/el-camino-de-muerte/index.html",
   cover: "../assets/cover/EL CAMINO DE MUERTE.jpg",
 },
   {
     title: "El Precio de Ser Cristiano en Tiempos Modernos",
     description: "Versión preliminar.",
     href: "./revistas/el-precio-de-ser-cristiano-en-tiempos-modernos/index.html",
     cover: "../assets/cover/El Precio De Ser Cristiano En Tiempos Modernos.png",
   }
];

const grid = document.getElementById("revistas-grid");

if (grid) {
  revistas.forEach((revista) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img class="card-cover" src="${revista.cover}" alt="Portada de ${revista.description}" loading="lazy" />
      <h2>${revista.title}</h2>
      <p>${revista.description}</p>
      <a class="button" href="${revista.href}">Abrir revista</a>
    `;
    grid.appendChild(card);
  });
}
