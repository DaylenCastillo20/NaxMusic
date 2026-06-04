(function () {
    const TAB_CONFIG = {
        cotizaciones: {
            title: 'Gestion de Cotizaciones',
            description: 'Solicitudes recibidas desde el formulario de evento.',
            columns: ['ID', 'Cliente/Evento', 'Fecha Evento', 'Total', 'Estado', 'Acciones'],
            table: 'cotizaciones',
            idFields: ['id_cotizacion', 'id']
        },
        servicios: {
            title: 'Catalogo de Servicios',
            description: 'Servicios disponibles para cotizaciones y eventos.',
            columns: ['ID', 'Miniatura', 'Nombre', 'Categoria', 'Precio', 'Acciones'],
            table: 'servicios',
            idFields: ['id_servicio', 'id']
        },
        usuarios: {
            title: 'Usuarios Registrados',
            description: 'Monitoreo de clientes y administradores registrados.',
            columns: ['ID', 'Nombre', 'Email', 'Telefono', 'Rol/Tipo de Usuario'],
            table: 'usuarios',
            idFields: ['id_usuario', 'id']
        }
    };

    const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="116" height="88" viewBox="0 0 116 88"%3E%3Crect width="116" height="88" rx="12" fill="%23141418"/%3E%3Cpath d="M34 58l16-18 13 14 8-9 15 13" stroke="%23e5180a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3Ccircle cx="73" cy="31" r="7" fill="%23a1a1aa"/%3E%3C/svg%3E';
    const QUOTE_STATUS_OPTIONS = ['Pendiente', 'Aprobada', 'Cancelada'];

    let root = null;
    let supabaseClientPromise = null;
    let servicioControllerPromise = null;
    let activeTab = 'cotizaciones';
    let recordsByTab = {};

    window.initAdminConsole = initAdminConsole;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminConsole);
    } else {
        initAdminConsole();
    }

    function initAdminConsole() {
        root = document.getElementById('adminConsole');
        if (!root || root.dataset.initialized === 'true') return;

        root.dataset.initialized = 'true';

        root.querySelectorAll('[data-admin-tab]').forEach((button) => {
            button.addEventListener('click', () => cambiarTab(button.dataset.adminTab));
        });

        root.querySelector('#adminTableBody')?.addEventListener('click', manejarAccionTabla);
        root.querySelector('#adminModal')?.addEventListener('click', manejarCierreModal);
        root.querySelector('#addServiceButton')?.addEventListener('click', manejarBotonAgregar);
        document.addEventListener('keydown', manejarEscapeModal);

        cambiarTab(activeTab);
    }

    async function cambiarTab(tabName) {
        if (!TAB_CONFIG[tabName]) return;

        activeTab = tabName;
        recordsByTab[tabName] = [];
        pintarTabs(tabName);
        pintarEncabezado(tabName);
        pintarCargando(tabName);
        setStatus('Consultando Supabase...');

        try {
            const rows = await consultarTabla(tabName);
            recordsByTab[tabName] = rows;
            pintarFilas(tabName, rows);
            setStatus(rows.length ? `${rows.length} registros cargados` : '');
        } catch (error) {
            console.error(`Error cargando ${tabName}:`, error);
            pintarError(tabName, error.message || 'No se pudo completar la consulta.');
            setStatus('Error de consulta', true);
        }
    }

    function pintarTabs(tabName) {
        root.querySelectorAll('[data-admin-tab]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.adminTab === tabName);
        });
    }

    function pintarEncabezado(tabName) {
        const config = TAB_CONFIG[tabName];
        const title = root.querySelector('#adminTableTitle');
        const description = root.querySelector('#adminTableDescription');
        const thead = root.querySelector('#adminTableHead');
        const addButton = root.querySelector('#addServiceButton');

        if (title) title.textContent = config.title;
        if (description) description.textContent = config.description;
        if (addButton) {
            addButton.hidden = false;
            addButton.classList.remove('hidden');
            const svgIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`;
            if (tabName === 'servicios') addButton.innerHTML = `${svgIcon} Agregar Servicio`;
            if (tabName === 'cotizaciones') addButton.innerHTML = `${svgIcon} Nueva Cotizacion`;
            if (tabName === 'usuarios') addButton.innerHTML = `${svgIcon} Registrar Usuario`;
        }
        if (thead) {
            thead.innerHTML = `<tr>${config.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr>`;
        }
    }

    async function consultarTabla(tabName) {
        const supabase = await obtenerSupabase();
        const config = TAB_CONFIG[tabName];
        let query = supabase.from(config.table).select('*');

        if (tabName === 'cotizaciones') query = query.order('fecha_evento', { ascending: false });
        if (tabName === 'servicios') query = query.order('id_servicio', { ascending: true });
        if (tabName === 'usuarios') query = query.order('nombre', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return Array.isArray(data) ? data : [];
    }

    function pintarFilas(tabName, rows) {
        const tbody = root.querySelector('#adminTableBody');
        if (!tbody) return;

        if (!rows.length) {
            tbody.innerHTML = obtenerFilaVacia(TAB_CONFIG[tabName].columns.length, mensajeVacio(tabName));
            return;
        }

        if (tabName === 'cotizaciones') {
            tbody.innerHTML = rows.map(renderCotizacionRow).join('');
            return;
        }

        if (tabName === 'servicios') {
            tbody.innerHTML = rows.map(renderServicioRow).join('');
            return;
        }

        tbody.innerHTML = rows.map(renderUsuarioRow).join('');
    }

    function renderCotizacionRow(row) {
        const id = getId(row, TAB_CONFIG.cotizaciones.idFields);
        const cliente = firstValue(row, ['nombre_cliente', 'cliente_nombre', 'cliente', 'nombre'], 'Cliente sin nombre');
        const evento = firstValue(row, ['nombre_evento', 'tipo_evento', 'evento'], 'Evento sin titulo');
        const fecha = firstValue(row, ['fecha_evento', 'fecha'], '');
        const hora = firstValue(row, ['hora_evento', 'hora'], '');
        const total = firstValue(row, ['total', 'valor_total', 'monto'], 0);
        const estado = firstValue(row, ['estado'], 'Pendiente');

        return `
            <tr>
                <td class="gc-code">#${escapeHtml(id)}</td>
                <td>
                    <div class="gc-td-main">${escapeHtml(cliente)}</div>
                    <div class="gc-td-sub">${escapeHtml(evento)}</div>
                </td>
                <td>
                    <div class="gc-td-main">${escapeHtml(formatDate(fecha))}</div>
                    <div class="gc-td-sub">${escapeHtml(hora || 'Sin hora')}</div>
                </td>
                <td class="gc-total">${escapeHtml(formatCurrency(total))}</td>
                <td>${estadoBadge(estado)}</td>
                <td>
                    <div class="gc-actions">
                        <button class="gc-btn-icon" type="button" data-action="view-quote" data-id="${escapeAttribute(id)}" aria-label="Ver detalle de cotizacion ${escapeAttribute(id)}" title="Ver detalle">👁️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderServicioRow(row) {
        const id = getId(row, TAB_CONFIG.servicios.idFields);
        const image = getImageUrl(row);
        const nombre = firstValue(row, ['nombre', 'titulo', 'name'], 'Servicio sin nombre');
        const categoria = firstValue(row, ['categoria', 'category', 'tipo'], 'Sin categoria');
        const precio = firstValue(row, ['precio', 'price'], 0);

        return `
            <tr>
                <td class="gc-code">#${escapeHtml(id)}</td>
                <td>
                    ${image
                        ? `<img class="gc-thumb" src="${escapeAttribute(image)}" alt="${escapeAttribute(nombre)}" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">`
                        : '<div class="gc-thumb-placeholder" aria-hidden="true">-</div>'}
                </td>
                <td>
                    <div class="gc-td-main">${escapeHtml(nombre)}</div>
                    <div class="gc-td-sub">${escapeHtml(firstValue(row, ['descripcion'], ''))}</div>
                </td>
                <td>${escapeHtml(categoria)}</td>
                <td class="gc-total">${escapeHtml(formatCurrency(precio))}</td>
                <td>
                    <div class="gc-actions">
                        <button class="gc-btn-icon" type="button" data-action="edit-service" data-id="${escapeAttribute(id)}" aria-label="Editar servicio ${escapeAttribute(nombre)}" title="Editar servicio">✏️</button>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderUsuarioRow(row) {
        const id = getId(row, TAB_CONFIG.usuarios.idFields);
        const nombre = firstValue(row, ['nombre', 'name'], 'Usuario sin nombre');
        const email = firstValue(row, ['email', 'correo'], 'Sin email');
        const telefono = firstValue(row, ['telefono', 'phone', 'celular'], 'Sin telefono');
        const rol = firstValue(row, ['tipo_usuario', 'rol', 'role'], 'Cliente');

        return `
            <tr>
                <td class="gc-code">#${escapeHtml(id)}</td>
                <td class="gc-td-main">${escapeHtml(nombre)}</td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(telefono)}</td>
                <td>${escapeHtml(rol)}</td>
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
            return;
        }

        if (action === 'edit-service') {
            await abrirModalServicio(id);
        }
    }

    function manejarBotonAgregar() {
        if (activeTab === 'servicios') {
            abrirModalCrearServicio();
        } else if (activeTab === 'usuarios') {
            abrirModalCrearUsuario();
        } else if (activeTab === 'cotizaciones') {
            if (typeof window.cargarContenido === 'function') {
                window.cargarContenido('servicios');
            } else {
                window.location.href = 'index.html';
            }
        }
    }

    async function cargarBcrypt() {
        if (window.dcodeIO?.bcrypt) return window.dcodeIO.bcrypt;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/bcryptjs@2.4.3/dist/bcrypt.js';
            script.onload = () => resolve(window.dcodeIO.bcrypt);
            script.onerror = () => reject(new Error('No se pudo cargar bcryptjs'));
            document.head.appendChild(script);
        });
    }

    function abrirModalCrearUsuario() {
        let isAdmin = false;
        try {
            const sessionData = localStorage.getItem('sessionUser');
            if (sessionData) {
                const user = JSON.parse(sessionData);
                if (user.tipo_usuario === 'Administrador') isAdmin = true;
            }
        } catch(e) {}

        if (!isAdmin) {
            mostrarAlertaExito('No tienes permisos para crear usuarios.');
            return;
        }

        abrirModal(`
            <form class="gc-modal-body" id="userCreateForm">
                <p class="gc-modal-kicker">Gestion de usuarios</p>
                <h3 id="adminModalTitle">Registrar Nuevo Usuario</h3>

                <div class="gc-form-grid">
                    <div class="gc-form-field">
                        <label for="userName">Nombre Completo</label>
                        <input id="userName" name="nombre" type="text" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="userEmail">Correo Electronico</label>
                        <input id="userEmail" name="email" type="email" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="userPhone">Telefono</label>
                        <input id="userPhone" name="telefono" type="tel" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="userRole">Rol del Usuario</label>
                        <select id="userRole" name="tipo_usuario" required>
                            <option value="Cliente">Cliente</option>
                            <option value="Administrador">Administrador</option>
                        </select>
                    </div>
                    <div class="gc-form-field is-full">
                        <label for="userPassword">Contraseña</label>
                        <input id="userPassword" name="password" type="password" required>
                    </div>
                </div>

                <div class="gc-modal-actions">
                    <button class="gc-action-secondary" type="button" data-modal-close>Cancelar</button>
                    <button class="gc-action-primary" type="submit">Crear Usuario</button>
                </div>
                <div class="gc-modal-message" id="userModalMessage"></div>
            </form>
        `);

        root.querySelector('#userCreateForm')?.addEventListener('submit', guardarNuevoUsuario);
    }

    async function guardarNuevoUsuario(event) {
        event.preventDefault();
        
        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');
        const message = root.querySelector('#userModalMessage');
        
        const formData = new FormData(form);
        const nombre = normalizarTexto(formData.get('nombre'));
        const email = normalizarTexto(formData.get('email'));
        const telefono = normalizarTexto(formData.get('telefono'));
        const tipo_usuario = formData.get('tipo_usuario');
        const password = formData.get('password');

        if (!nombre || !email || !password) {
            setModalMessage(message, 'Completa los campos obligatorios.', true);
            return;
        }

        setButtonLoading(button, true, 'Creando...');
        setModalMessage(message, 'Validando y encriptando...');

        try {
            const bcrypt = await cargarBcrypt();
            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(password, salt);

            const supabase = await obtenerSupabase();
            
            const { data: existingUser } = await supabase.from('usuarios').select('id_usuario').eq('email', email);
            if (existingUser && existingUser.length > 0) {
                throw new Error('El correo ya está registrado.');
            }

            const { error } = await supabase.from('usuarios').insert([{
                nombre,
                email,
                telefono,
                password: passwordHash,
                tipo_usuario
            }]);

            if (error) throw error;

            setModalMessage(message, 'Usuario creado exitosamente.');
            cerrarModal();
            mostrarAlertaExito('Usuario creado correctamente.');
            await cambiarTab('usuarios');
        } catch (error) {
            console.error('Error creando usuario:', error);
            setModalMessage(message, error.message || 'Error al crear usuario.', true);
        } finally {
            setButtonLoading(button, false);
        }
    }

    async function abrirModalCotizacion(id) {
        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Detalle de cotizacion</p>
                <h3 id="adminModalTitle">Cargando solicitud #${escapeHtml(id)}</h3>
                <div class="gc-empty-state"><div class="gc-empty-icon">...</div><p>Consultando informacion del evento</p></div>
            </div>
        `);

        try {
            const cotizacion = await obtenerRegistroPorId('cotizaciones', TAB_CONFIG.cotizaciones.idFields, id);
            const detalles = await obtenerDetalleCotizacion(id);
            renderModalCotizacion(cotizacion, detalles, id);
        } catch (error) {
            console.error('Error abriendo cotizacion:', error);
            abrirModalError('Detalle de cotizacion', error.message || 'No se pudo cargar la cotizacion.');
        }
    }

    function renderModalCotizacion(cotizacion, detalles, id) {
        const estadoActual = firstValue(cotizacion, ['estado'], 'Pendiente');
        const total = firstValue(cotizacion, ['total', 'valor_total', 'monto'], calcularTotalDetalles(detalles));
        const detalleRows = detalles.length
            ? detalles.map(renderDetalleCotizacionRow).join('')
            : `<div class="gc-empty-state"><div class="gc-empty-icon">∅</div><p>No hay servicios asociados a esta cotizacion.</p></div>`;

        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Detalle de cotizacion</p>
                <h3 id="adminModalTitle">${escapeHtml(firstValue(cotizacion, ['nombre_evento', 'tipo_evento'], `Solicitud #${id}`))}</h3>

                <div class="gc-detail-grid">
                    ${detailItem('Cliente', firstValue(cotizacion, ['nombre_cliente', 'cliente_nombre', 'cliente', 'nombre'], 'Sin cliente'))}
                    ${detailItem('Lugar', firstValue(cotizacion, ['lugar', 'ubicacion'], 'Sin lugar'))}
                    ${detailItem('Fecha', `${formatDate(firstValue(cotizacion, ['fecha_evento', 'fecha'], ''))} ${firstValue(cotizacion, ['hora_evento', 'hora'], '')}`)}
                    ${detailItem('Asistentes', firstValue(cotizacion, ['cantidad_asistentes', 'asistentes'], 'Sin dato'))}
                    ${detailItem('Tipo de evento', firstValue(cotizacion, ['tipo_evento'], 'Sin tipo'))}
                    ${detailItem('Total', formatCurrency(total))}
                    ${detailItem('Descripcion', firstValue(cotizacion, ['descripcion', 'notas', 'observaciones'], 'Sin descripcion'))}
                </div>

                <div class="gc-breakdown">
                    <div class="gc-breakdown-header">
                        <span>Servicio</span>
                        <span>Cantidad</span>
                        <span>Subtotal</span>
                    </div>
                    ${detalleRows}
                </div>

                <div class="gc-modal-actions">
                    <select class="gc-status-select" id="quoteStatusSelect" aria-label="Estado de la cotizacion">
                        ${QUOTE_STATUS_OPTIONS.map((status) => `<option value="${escapeAttribute(status)}"${normalizarEstado(status) === normalizarEstado(estadoActual) ? ' selected' : ''}>${escapeHtml(status)}</option>`).join('')}
                    </select>
                    <button class="gc-action-primary" type="button" id="saveQuoteStatus" data-id="${escapeAttribute(id)}">Guardar estado</button>
                </div>
                <div class="gc-modal-message" id="quoteModalMessage"></div>
            </div>
        `);

        root.querySelector('#saveQuoteStatus')?.addEventListener('click', guardarEstadoCotizacion);
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

    async function guardarEstadoCotizacion(event) {
        const button = event.currentTarget;
        const id = button.dataset.id;
        const select = root.querySelector('#quoteStatusSelect');
        const message = root.querySelector('#quoteModalMessage');
        const estado = select?.value || 'Pendiente';

        setButtonLoading(button, true);
        setModalMessage(message, 'Guardando nuevo estado...');

        try {
            await actualizarPorId('cotizaciones', TAB_CONFIG.cotizaciones.idFields, id, { estado });
            setModalMessage(message, 'Estado actualizado correctamente.');
            cerrarModal();
            await cambiarTab('cotizaciones');
        } catch (error) {
            console.error('Error actualizando estado:', error);
            setModalMessage(message, error.message || 'No se pudo actualizar el estado.', true);
        } finally {
            setButtonLoading(button, false);
        }
    }

    function abrirModalCrearServicio() {
        renderModalServicio({
            nombre: '',
            categoria: '',
            precio: '',
            imagen_url: '',
            descripcion: ''
        }, '', 'crear');
    }

    async function abrirModalServicio(id) {
        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Editar servicio</p>
                <h3 id="adminModalTitle">Cargando servicio #${escapeHtml(id)}</h3>
                <div class="gc-empty-state"><div class="gc-empty-icon">...</div><p>Consultando catalogo</p></div>
            </div>
        `);

        try {
            const servicio = await obtenerRegistroPorId('servicios', TAB_CONFIG.servicios.idFields, id);
            renderModalServicio(servicio, id, 'editar');
        } catch (error) {
            console.error('Error abriendo servicio:', error);
            abrirModalError('Editar servicio', error.message || 'No se pudo cargar el servicio.');
        }
    }

    function renderModalServicio(servicio, id, modo = 'editar') {
        const esCreacion = modo === 'crear';
        const imageField = getImageField(servicio) || 'imagen_url';
        const tituloModal = esCreacion
            ? 'Agregar Nuevo Servicio'
            : `Editar ${firstValue(servicio, ['nombre', 'titulo'], `servicio #${id}`)}`;
        const textoBoton = esCreacion ? 'Crear Servicio' : 'Guardar cambios';
        const precioValue = esCreacion ? '' : firstValue(servicio, ['precio', 'price'], 0);

        abrirModal(`
            <form class="gc-modal-body" id="serviceEditForm" data-mode="${escapeAttribute(modo)}" data-id="${escapeAttribute(id)}" data-image-field="${escapeAttribute(imageField)}">
                <p class="gc-modal-kicker">Catalogo de servicios</p>
                <h3 id="adminModalTitle">${escapeHtml(tituloModal)}</h3>

                <div class="gc-form-grid">
                    <div class="gc-form-field">
                        <label for="serviceName">Nombre</label>
                        <input id="serviceName" name="nombre" type="text" value="${escapeAttribute(firstValue(servicio, ['nombre', 'titulo'], ''))}" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="serviceCategory">Categoria</label>
                        <input id="serviceCategory" name="categoria" type="text" value="${escapeAttribute(firstValue(servicio, ['categoria', 'category', 'tipo'], ''))}" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="servicePrice">Precio</label>
                        <input id="servicePrice" name="precio" type="number" min="0" step="0.01" value="${escapeAttribute(precioValue)}" required>
                    </div>
                    <div class="gc-form-field">
                        <label for="serviceImage">URL de la Imagen</label>
                        <input id="serviceImage" name="imagen" type="text" value="${escapeAttribute(getImageUrl(servicio))}"${esCreacion ? ' required' : ''}>
                    </div>
                    <div class="gc-form-field is-full">
                        <label for="serviceDescription">Descripcion</label>
                        <textarea id="serviceDescription" name="descripcion" required>${escapeHtml(firstValue(servicio, ['descripcion'], ''))}</textarea>
                    </div>
                </div>

                <div class="gc-modal-actions">
                    <button class="gc-action-secondary" type="button" data-modal-close>Cancelar</button>
                    <button class="gc-action-primary" type="submit">${escapeHtml(textoBoton)}</button>
                </div>
                <div class="gc-modal-message" id="serviceModalMessage"></div>
            </form>
        `);

        root.querySelector('#serviceEditForm')?.addEventListener('submit', (event) => {
            if (esCreacion) {
                crearServicioDesdeFormulario(event);
                return;
            }

            guardarServicio(event, servicio);
        });
    }

    async function crearServicioDesdeFormulario(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');
        const message = root.querySelector('#serviceModalMessage');

        try {
            const payload = leerPayloadServicio(form, 'imagen_url');
            validarPayloadServicio(payload);

            setButtonLoading(button, true, 'Creando...');
            setModalMessage(message, 'Creando servicio...');

            const controller = await obtenerServicioController();
            await controller.crearServicio(payload);

            form.reset();
            cerrarModal();
            mostrarAlertaExito('Servicio creado correctamente.');
            await cambiarTab('servicios');
        } catch (error) {
            console.error('Error creando servicio:', error);
            setModalMessage(message, error.message || 'No se pudo crear el servicio.', true);
        } finally {
            setButtonLoading(button, false);
        }
    }

    async function guardarServicio(event, servicioOriginal) {
        event.preventDefault();

        const form = event.currentTarget;
        const button = form.querySelector('[type="submit"]');
        const message = root.querySelector('#serviceModalMessage');
        const id = form.dataset.id;
        const imageField = form.dataset.imageField || 'imagen_url';
        let payloadCompleto = null;

        try {
            payloadCompleto = leerPayloadServicio(form, imageField);
            validarPayloadServicio(payloadCompleto);
        } catch (error) {
            setModalMessage(message, error.message, true);
            return;
        }

        setButtonLoading(button, true, 'Guardando...');
        setModalMessage(message, 'Guardando cambios...');

        try {
            await actualizarServicioConFallback(id, payloadCompleto, servicioOriginal);
            setModalMessage(message, 'Servicio actualizado correctamente.');
            cerrarModal();
            await cambiarTab('servicios');
        } catch (error) {
            console.error('Error actualizando servicio:', error);
            setModalMessage(message, error.message || 'No se pudo actualizar el servicio.', true);
        } finally {
            setButtonLoading(button, false);
        }
    }

    function leerPayloadServicio(form, imageField) {
        const formData = new FormData(form);

        return {
            nombre: normalizarTexto(formData.get('nombre')),
            categoria: normalizarTexto(formData.get('categoria')),
            precio: Number(formData.get('precio') || 0),
            descripcion: normalizarTexto(formData.get('descripcion')),
            [imageField]: normalizarTexto(formData.get('imagen'))
        };
    }

    function validarPayloadServicio(payload) {
        const imagen = payload.imagen_url || payload.url_imagen || payload.imagen || payload.image_url || payload.image;

        if (!payload.nombre || !payload.categoria || !payload.descripcion || !imagen) {
            throw new Error('Completa nombre, categoria, precio, URL de imagen y descripcion.');
        }

        if (!Number.isFinite(payload.precio) || payload.precio <= 0) {
            throw new Error('El precio debe ser un numero mayor a cero.');
        }
    }

    async function actualizarServicioConFallback(id, payloadCompleto, servicioOriginal) {
        try {
            await actualizarPorId('servicios', TAB_CONFIG.servicios.idFields, id, payloadCompleto);
            return;
        } catch (error) {
            const payloadCompatible = Object.fromEntries(
                Object.entries(payloadCompleto).filter(([key]) => Object.prototype.hasOwnProperty.call(servicioOriginal, key))
            );

            ['nombre', 'descripcion', 'precio'].forEach((key) => {
                if (Object.prototype.hasOwnProperty.call(payloadCompleto, key)) payloadCompatible[key] = payloadCompleto[key];
            });

            if (!Object.keys(payloadCompatible).length) throw error;
            await actualizarPorId('servicios', TAB_CONFIG.servicios.idFields, id, payloadCompatible);
        }
    }

    async function obtenerDetalleCotizacion(id) {
        const supabase = await obtenerSupabase();
        const { data, error } = await supabase
            .from('detalle_cotizacion')
            .select('*, servicios(*)')
            .eq('id_cotizacion', id);

        if (!error) return Array.isArray(data) ? data : [];

        console.warn('Join detalle_cotizacion -> servicios no disponible, usando consulta secundaria:', error);

        const { data: detalles, error: detalleError } = await supabase
            .from('detalle_cotizacion')
            .select('*')
            .eq('id_cotizacion', id);

        if (detalleError) throw detalleError;
        if (!detalles?.length) return [];

        const idsServicios = [...new Set(detalles.map((row) => row.id_servicio).filter(Boolean))];
        if (!idsServicios.length) return detalles;

        const { data: servicios, error: serviciosError } = await supabase
            .from('servicios')
            .select('*')
            .in('id_servicio', idsServicios);

        if (serviciosError) return detalles;

        const servicioMap = new Map((servicios || []).map((servicio) => [String(servicio.id_servicio || servicio.id), servicio]));
        return detalles.map((detalle) => ({
            ...detalle,
            servicios: servicioMap.get(String(detalle.id_servicio)) || null
        }));
    }

    async function obtenerRegistroPorId(table, idFields, id) {
        const supabase = await obtenerSupabase();
        let lastError = null;

        for (const field of idFields) {
            const { data, error } = await supabase.from(table).select('*').eq(field, id).limit(1).maybeSingle();
            if (!error && data) return data;
            lastError = error || lastError;
        }

        throw lastError || new Error('Registro no encontrado.');
    }

    async function actualizarPorId(table, idFields, id, payload) {
        const supabase = await obtenerSupabase();
        let lastError = null;

        for (const field of idFields) {
            const { error } = await supabase.from(table).update(payload).eq(field, id);
            if (!error) return true;
            lastError = error;
        }

        throw lastError || new Error('No se pudo actualizar el registro.');
    }

    async function obtenerSupabase() {
        if (window.supabase?.from) return window.supabase;
        if (!supabaseClientPromise) {
            const script = document.querySelector('script[src$="js/admin_console.js"]');
            const moduleUrl = new URL('../config/DatabaseConfig.js', script?.src || window.location.href).href;
            supabaseClientPromise = import(moduleUrl).then((module) => {
                window.supabase = module.supabase;
                return module.supabase;
            });
        }

        return supabaseClientPromise;
    }

    async function obtenerServicioController() {
        if (window.ServicioController?.crearServicio) {
            return window.ServicioController;
        }

        if (!servicioControllerPromise) {
            const script = document.querySelector('script[src$="js/admin_console.js"]');
            const moduleUrl = new URL('../controllers/servicio_controller.js', script?.src || window.location.href).href;
            servicioControllerPromise = import(moduleUrl).then(() => {
                if (!window.ServicioController?.crearServicio) {
                    throw new Error('ServicioController.crearServicio no esta disponible.');
                }

                return window.ServicioController;
            });
        }

        return servicioControllerPromise;
    }

    function abrirModal(markup) {
        const modal = root.querySelector('#adminModal');
        const content = root.querySelector('#adminModalContent');
        if (!modal || !content) return;

        content.innerHTML = markup;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function abrirModalError(title, message) {
        abrirModal(`
            <div class="gc-modal-body">
                <p class="gc-modal-kicker">Error</p>
                <h3 id="adminModalTitle">${escapeHtml(title)}</h3>
                <div class="gc-empty-state">
                    <div class="gc-empty-icon">!</div>
                    <p>${escapeHtml(message)}</p>
                </div>
            </div>
        `);
    }

    function cerrarModal() {
        const modal = root?.querySelector('#adminModal');
        if (!modal) return;

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function manejarCierreModal(event) {
        if (event.target.closest('[data-modal-close]')) {
            cerrarModal();
        }
    }

    function manejarEscapeModal(event) {
        if (event.key === 'Escape' && root?.querySelector('#adminModal')?.classList.contains('is-open')) {
            cerrarModal();
        }
    }

    function pintarCargando(tabName) {
        const tbody = root.querySelector('#adminTableBody');
        if (!tbody) return;
        tbody.innerHTML = obtenerFilaVacia(TAB_CONFIG[tabName].columns.length, 'Cargando registros...');
    }

    function pintarError(tabName, message) {
        const tbody = root.querySelector('#adminTableBody');
        if (!tbody) return;
        tbody.innerHTML = obtenerFilaVacia(TAB_CONFIG[tabName].columns.length, message, '!');
    }

    function obtenerFilaVacia(colspan, message, icon) {
        return `
            <tr class="gc-empty-row">
                <td colspan="${colspan}">
                    <div class="gc-empty-state">
                        <div class="gc-empty-icon" aria-hidden="true">${escapeHtml(icon || '∅')}</div>
                        <p>${escapeHtml(message)}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function mensajeVacio(tabName) {
        const messages = {
            cotizaciones: 'No hay cotizaciones disponibles en este momento.',
            servicios: 'No hay servicios disponibles en el catalogo.',
            usuarios: 'No hay usuarios registrados para mostrar.'
        };

        return messages[tabName] || 'No hay registros disponibles.';
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

    function setStatus(text, isError) {
        const status = root.querySelector('#adminConsoleStatus');
        if (!status) return;
        status.textContent = text || '';
        status.classList.toggle('is-error', Boolean(isError));
    }

    function setButtonLoading(button, loading, loadingText = 'Guardando...') {
        if (!button) return;
        button.disabled = loading;
        if (loading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            delete button.dataset.originalText;
        }
    }

    function setModalMessage(element, text, isError) {
        if (!element) return;
        element.textContent = text || '';
        element.classList.toggle('is-error', Boolean(isError));
    }

    function mostrarAlertaExito(message) {
        setStatus(message || 'Operacion completada.');
        window.alert(message || 'Operacion completada.');
    }

    function calcularTotalDetalles(detalles) {
        return (detalles || []).reduce((sum, detalle) => sum + Number(firstValue(detalle, ['subtotal', 'total'], 0) || 0), 0);
    }

    function getId(row, idFields) {
        return firstValue(row, idFields, '');
    }

    function getImageUrl(row) {
        return firstValue(row, ['imagen_url', 'url_imagen', 'imagen', 'image_url', 'image'], '');
    }

    function getImageField(row) {
        return ['imagen_url', 'url_imagen', 'imagen', 'image_url', 'image'].find((key) => Object.prototype.hasOwnProperty.call(row, key));
    }

    function firstValue(row, keys, fallback) {
        for (const key of keys) {
            const value = row?.[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }

        return fallback;
    }

    function normalizarTexto(value) {
        return String(value || '').trim();
    }

    function normalizarEstado(value) {
        return normalizarTexto(value)
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
