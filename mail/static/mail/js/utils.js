/**
 * Utilidades compartidas para la aplicación de correo
 * Funciones helper para escape de HTML y formateo de texto
 */

/**
 * Escapa HTML para prevenir ataques XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - HTML escapado de forma segura
 */
function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Formatea el cuerpo del email convirtiendo saltos de línea en <br> tags
 * @param {string} body - Texto del cuerpo del email
 * @returns {string} - HTML formateado
 */
function formatEmailBody(body) {
	if (!body) return '<em>(No content)</em>';

	// Convertir saltos de línea a tags <br>
	return body.replace(/\n/g, '<br>');
}

// Exportar funciones al objeto window para compatibilidad global
window.escapeHtml = escapeHtml;
window.formatEmailBody = formatEmailBody;
