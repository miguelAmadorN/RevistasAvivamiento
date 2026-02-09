# Revistas Avivamiento

Proyecto estático (HTML, CSS y JS) listo para desplegar en Cloudflare Pages.

## Estructura

- `index.html`: redirige automáticamente a `/revistas-avivamiento/menu.html`.
- `revistas-avivamiento/menu.html`: menú principal de revistas.
- `revistas-avivamiento/revistas/*.html`: una página por revista.
- `assets/`: estilos y JavaScript compartido.

## Deploy en Cloudflare Pages

1. Conecta este repositorio en Cloudflare Pages.
2. Configura:
   - **Framework preset**: `None`
   - **Build command**: *(vacío)*
   - **Build output directory**: `/`
3. Publica.
