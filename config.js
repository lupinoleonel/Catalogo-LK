
// --- CONFIGURACIÓN CENTRAL ---
const GOOGLE_SHEET_ID = '15MHZbOJQ6-cHp1eTilX2pjMwpj3UrKL7s2_3v0LjjT4';
const LOW_STOCK_THRESHOLD = 5;
// -----------------------------

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

// Si el tipo viene por URL, lo guardamos en localStorage
if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  // Si no viene por URL, tratamos de obtenerlo del localStorage
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista';
}

// Ahora sí podemos usar 'tipo' correctamente en el resto del archivo
const esMinorista = tipo === 'minorista';

// Define texto personalizado según el tipo de catálogo
const textos = {
  mayorista: {
      titulo: "Catálogo Revendedores",
      tituloPagina: "Lion Kids (Revendedores)",
      etiquetaPrecio: "Revendedor",
      etiquetaPromo: "$ Sugerido de venta"
  },
  minorista: {
      titulo: "Catálogo Minorista",
      tituloPagina: "Lion Kids (Minoristas)",
      etiquetaPrecio: "Precio",
      etiquetaPromo: "3 artículos surtidos"
  }
};



