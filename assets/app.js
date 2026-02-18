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
