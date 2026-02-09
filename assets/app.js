const revistas = [
  {
    title: "Revista 01: Qué es el discipulado",
    description: "Fundamentos del discipulado cristiano para nuevos creyentes.",
    href: "../QueEsElDiscipulado.html",
  },
  {
    title: "Revista 02: Vida de oración",
    description: "Guía práctica para fortalecer la oración diaria.",
    href: "./revistas/vida-de-oracion.html",
  },
  {
    title: "Revista 03: Evangelismo local",
    description: "Ideas sencillas para compartir el evangelio en tu comunidad.",
    href: "./revistas/evangelismo-local.html",
  },
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
