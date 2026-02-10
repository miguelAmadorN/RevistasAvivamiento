const revistas = [
  {
    title: "Las Doctrinas Bíblicas de la Salvación",
    description: "Las Doctrinas Bíblicas de la Salvación Primera Parte",
    href: "./revistas/LasDoctrinasBiblicasDeLaSalvacion1P.html",
  },
  {
    title: "Las Doctrinas Bíblicas de la Salvación",
    description: "Las Doctrinas Bíblicas de la Salvación Segunda Parte",
    href: "./revistas/LasDoctrinasBiblicasDeLaSalvacion2P.html",
  },{
       title: "¿Qué es el discipulado?",
       description: "Fundamentos del discipulado cristiano para nuevos creyentes.",
       href: "./revistas/QueEsElDiscipulado.html",
     }
];

const grid = document.getElementById("revistas-grid");

if (grid) {
  revistas.forEach((revista) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h2>${revista.title}</h2>
      <p>${revista.description}</p>
      <a class="button" href="${revista.href}">Abrir revista</a>
    `;
    grid.appendChild(card);
  });
}
