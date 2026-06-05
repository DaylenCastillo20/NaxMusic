(function () {
    const COLUMNS = ['ID', 'Evento', 'Fecha Evento', 'Total', 'Estado', 'Acciones'];

    let root = null;
    let supabaseClientPromise = null;

    window.initMisCotizaciones = initMisCotizaciones;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMisCotizaciones);
    } else {
        initMisCotizaciones();
    }

    function initMisCotizaciones() {
        root = document.getElementById('misCotizacionesPanel');
        if (!root || root.dataset.initialized === 'true') return;
        root.dataset.initialized = 'true';

        // Render table header
        const thead = root.querySelector('#mcTableHead');
        if (thead) {
            thead.innerHTML = `<tr>${COLUMNS.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
        }

        // Wire up click events on table body for actions
        root.querySelector('#mcTableBody')?.addEventListener('click', manejarAccionTabla);

        // Wire up modal close
        root.querySelector('#mcModal')?.addEventListener('click', manejarCierreModal);
        document.addEventListener('keydown', manejarEscapeModal);

        // Wire up "Nueva Cotización" button
        root.querySelector('#mcNuevaCotizacion')?.addEventListener('click', () => {
            if (typeof window.cargarContenido === 'function') {
                window.cargarContenido('servicios');
            }
        });

        cargarCotizacionesCliente();
    }

    async function cargarCotizacionesCliente() {
        const tbody = root.querySelector('#mcTableBody');
        const status = root.querySelector('#mcStatus');
        if (!tbody) return;

        tbody.innerHTML = obtenerFilaVacia('Cargando tus cotizaciones...');
        setStatus(status, 'Consultando...');

        try {
            const usuario = obtenerUsuarioSesion();

            if (!usuario || !usuario.id_usuario) {
                tbody.innerHTML = obtenerFilaVacia('Debes iniciar sesión para ver tus cotizaciones.');
                setStatus(status, '');
                return;
            }

            const supabase = await obtenerSupabase();

            const { data, error } = await supabase
                .from('cotizaciones')
                .select('*')
                .eq('id_usuario', usuario.id_usuario)
                .order('fecha_cotizacion', { ascending: false });

            if (error) throw error;

            const rows = Array.isArray(data) ? data : [];

            if (!rows.length) {
                tbody.innerHTML = obtenerFilaVacia('Aún no tienes cotizaciones. ¡Crea tu primera cotización!');
                setStatus(status, '');
                return;
            }

            tbody.innerHTML = rows.map(renderCotizacionRow).join('');
            setStatus(status, `${rows.length} cotización${rows.length !== 1 ? 'es' : ''} encontrada${rows.length !== 1 ? 's' : ''}`);

        } catch (error) {
            console.error('Error cargando mis cotizaciones:', error);
            tbody.innerHTML = obtenerFilaVacia('No se pudieron cargar tus cotizaciones.', '!');
            setStatus(status, 'Error de consulta', true);
        }
    }

    function renderCotizacionRow(row) {
        const id = firstValue(row, ['id_cotizacion', 'id'], '');
        const evento = firstValue(row, ['nombre_evento', 'tipo_evento', 'evento'], 'Evento sin título');
        const lugar = firstValue(row, ['lugar', 'ubicacion'], '');
        const fecha = firstValue(row, ['fecha_evento', 'fecha'], '');
        const hora = firstValue(row, ['hora_evento', 'hora'], '');
        const total = firstValue(row, ['total', 'valor_total', 'monto'], 0);
        const estado = firstValue(row, ['estado'], 'Pendiente');

        return `
            <tr>
                <td class="gc-code">#${escapeHtml(id)}</td>
                <td>
                    <div class="gc-td-main">${escapeHtml(evento)}</div>
                    <div class="gc-td-sub">${escapeHtml(lugar || 'Sin lugar')}</div>
                </td>
                <td>
                    <div class="gc-td-main">${escapeHtml(formatDate(fecha))}</div>
                    <div class="gc-td-sub">${escapeHtml(hora || 'Sin hora')}</div>
                </td>
                <td class="gc-total">${escapeHtml(formatCurrency(total))}</td>
                <td>${estadoBadge(estado)}</td>
                <td>
                    <div class="gc-actions">
                        <button class="gc-btn-icon" type="button" data-action="view-quote" data-id="${escapeAttribute(id)}" aria-label="Ver detalle de cotización ${escapeAttribute(id)}" title="Ver detalle">👁️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    async function manejarAccionTabla(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const { action, id } = button.dataset;
        if (!id) return;

        if (action === 'view-quote') {
            await abrirModalCotizacion(id);
        }
    }

    async function abrirModalCotizacion(id) {
        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Detalle de cotización</p>
                <h3 id="mcModalTitle">Cargando solicitud #${escapeHtml(id)}</h3>
                <div class="gc-empty-state"><div class="gc-empty-icon">...</div><p>Consultando información del evento</p></div>
            </div>
        `);

        try {
            const supabase = await obtenerSupabase();

            // Fetch quotation
            const { data: cotizacion, error: cotError } = await supabase
                .from('cotizaciones')
                .select('*')
                .eq('id_cotizacion', id)
                .single();

            if (cotError) throw cotError;

            // Fetch details with services join
            let detalles = [];
            const { data: detData, error: detError } = await supabase
                .from('detalle_cotizacion')
                .select('*, servicios(*)')
                .eq('id_cotizacion', id);

            if (!detError && detData) {
                detalles = detData;
            } else {
                // Fallback: fetch details without join
                const { data: detPlain } = await supabase
                    .from('detalle_cotizacion')
                    .select('*')
                    .eq('id_cotizacion', id);
                detalles = detPlain || [];
            }

            renderModalCotizacion(cotizacion, detalles, id);

        } catch (error) {
            console.error('Error abriendo cotización:', error);
            abrirModal(`
                <div class="gc-modal-body">
                    <p class="gc-modal-kicker">Error</p>
                    <h3 id="mcModalTitle">Detalle de cotización</h3>
                    <div class="gc-empty-state">
                        <div class="gc-empty-icon">!</div>
                        <p>${escapeHtml(error.message || 'No se pudo cargar la cotización.')}</p>
                    </div>
                </div>
            `);
        }
    }

    function renderModalCotizacion(cotizacion, detalles, id) {
        const total = firstValue(cotizacion, ['total', 'valor_total', 'monto'], calcularTotalDetalles(detalles));
        const estado = firstValue(cotizacion, ['estado'], 'Pendiente');

        const detalleRows = detalles.length
            ? detalles.map(renderDetalleCotizacionRow).join('')
            : `<div class="gc-empty-state"><div class="gc-empty-icon">∅</div><p>No hay servicios asociados a esta cotización.</p></div>`;

        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Detalle de cotización</p>
                <h3 id="mcModalTitle">${escapeHtml(firstValue(cotizacion, ['nombre_evento', 'tipo_evento'], `Solicitud #${id}`))}</h3>

                <div class="gc-detail-grid">
                    ${detailItem('Lugar', firstValue(cotizacion, ['lugar', 'ubicacion'], 'Sin lugar'))}
                    ${detailItem('Fecha', `${formatDate(firstValue(cotizacion, ['fecha_evento', 'fecha'], ''))} ${firstValue(cotizacion, ['hora_evento', 'hora'], '')}`)}
                    ${detailItem('Asistentes', firstValue(cotizacion, ['cantidad_asistentes', 'asistentes'], 'Sin dato'))}
                    ${detailItem('Tipo de evento', firstValue(cotizacion, ['tipo_evento'], 'Sin tipo'))}
                    ${detailItem('Total', formatCurrency(total))}
                    ${detailItem('Estado', estado)}
                    ${detailItem('Descripción', firstValue(cotizacion, ['descripcion', 'notas', 'observaciones'], 'Sin descripción'))}
                </div>

                <div class="gc-breakdown">
                    <div class="gc-breakdown-header">
                        <span>Servicio</span>
                        <span>Cantidad</span>
                        <span>Subtotal</span>
                    </div>
                    ${detalleRows}
                </div>

                <div class="gc-modal-actions" style="justify-content: flex-end;">
                    <button class="gc-action-secondary" type="button" data-mc-modal-close>Cerrar</button>
                </div>
            </div>
        `);
    }

    function renderDetalleCotizacionRow(row) {
        const servicio = row.servicios || row.servicio || {};
        const nombreServicio = firstValue(servicio, ['nombre', 'titulo'], firstValue(row, ['nombre_servicio'], 'Servicio sin nombre'));
        const cantidad = firstValue(row, ['cantidad'], 1);
        const subtotal = firstValue(row, ['subtotal', 'total'], Number(firstValue(servicio, ['precio'], 0)) * Number(cantidad || 1));

        return `
            <div class="gc-breakdown-row">
                <strong>${escapeHtml(nombreServicio)}</strong>
                <span>${escapeHtml(cantidad)}</span>
                <span>${escapeHtml(formatCurrency(subtotal))}</span>
            </div>
        `;
    }

    // ====================================
    // Modal helpers
    // ====================================

    function abrirModal(markup) {
        const modal = root.querySelector('#mcModal');
        const content = root.querySelector('#mcModalContent');
        if (!modal || !content) return;

        content.innerHTML = markup;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function cerrarModal() {
        const modal = root?.querySelector('#mcModal');
        if (!modal) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function manejarCierreModal(event) {
        if (event.target.closest('[data-mc-modal-close]')) {
            cerrarModal();
        }
    }

    function manejarEscapeModal(event) {
        if (event.key === 'Escape' && root?.querySelector('#mcModal')?.classList.contains('is-open')) {
            cerrarModal();
        }
    }

    // ====================================
    // Data helpers
    // ====================================

    function obtenerUsuarioSesion() {
        try {
            const sessionString = localStorage.getItem('sessionUser');
            if (!sessionString) return null;
            return JSON.parse(sessionString);
        } catch (e) {
            console.warn('No se pudo leer la sesión del usuario:', e);
            return null;
        }
    }

    async function obtenerSupabase() {
        if (window.supabase?.from) return window.supabase;
        if (!supabaseClientPromise) {
            const script = document.querySelector('script[src$="js/mis_cotizaciones.js"]');
            const moduleUrl = new URL('../config/DatabaseConfig.js', script?.src || window.location.href).href;
            supabaseClientPromise = import(moduleUrl).then((module) => {
                window.supabase = module.supabase;
                return module.supabase;
            });
        }
        return supabaseClientPromise;
    }

    // ====================================
    // Rendering utilities
    // ====================================

    function obtenerFilaVacia(message, icon) {
        return `
            <tr class="gc-empty-row">
                <td colspan="${COLUMNS.length}">
                    <div class="gc-empty-state">
                        <div class="gc-empty-icon" aria-hidden="true">${escapeHtml(icon || '∅')}</div>
                        <p>${escapeHtml(message)}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function estadoBadge(status) {
        const normalized = normalizarEstado(status);
        const className = {
            pendiente: 'gc-status-pendiente',
            aprobada: 'gc-status-aprobada',
            cancelada: 'gc-status-cancelada'
        }[normalized] || 'gc-status-neutral';

        return `<span class="gc-status-badge ${className}">${escapeHtml(status || 'Pendiente')}</span>`;
    }

    function detailItem(label, value) {
        return `
            <div class="gc-detail-item">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value || 'Sin dato')}</strong>
            </div>
        `;
    }

    function setStatus(element, text, isError) {
        if (!element) return;
        element.textContent = text || '';
        element.classList.toggle('is-error', Boolean(isError));
    }

    function calcularTotalDetalles(detalles) {
        return (detalles || []).reduce((sum, d) => sum + Number(firstValue(d, ['subtotal', 'total'], 0) || 0), 0);
    }

    function firstValue(row, keys, fallback) {
        for (const key of keys) {
            const value = row?.[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return fallback;
    }

    function normalizarEstado(value) {
        return String(value || '').trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function formatDate(value) {
        if (!value) return 'Sin fecha';
        const date = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        }).format(date);
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(Number.isFinite(amount) ? amount : 0);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
})();
