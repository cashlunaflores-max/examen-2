/* Nombre: Samuel Cash Luna Flores */ 
const API_KEY = 'a2f4846ecb293eb98168a4c93854f664';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

const seriesGrid    = document.getElementById('series-grid');
const loadingDiv    = document.getElementById('loading');
const errorDiv      = document.getElementById('error');
const errorMessage  = document.getElementById('error-message');
const resultsTitle  = document.getElementById('results-title');
const resultsCount  = document.getElementById('results-count');
const searchInput   = document.getElementById('search');
const clearBtn      = document.getElementById('clear-search');
const retryBtn      = document.getElementById('retry-btn');
const themeToggle   = document.getElementById('theme-toggle');
const modal         = document.getElementById('serie-modal');
const modalBody     = document.getElementById('modal-body');
const modalClose    = document.getElementById('modal-close');
const modalOverlay  = document.getElementById('modal-overlay');


// ============================================================================
// UTILIDADES DE UI (DADO - no modificar)
// ============================================================================
const mostrarLoading = () => {
    loadingDiv.style.display = 'flex';
    errorDiv.style.display = 'none';
    seriesGrid.innerHTML = '';
};

const ocultarLoading = () => {
    loadingDiv.style.display = 'none';
};

const mostrarError = (mensaje) => {
    ocultarLoading();
    errorMessage.textContent = mensaje;
    errorDiv.style.display = 'flex';
    seriesGrid.innerHTML = '';
};


// ============================================================================
// DARK MODE (DADO - no modificar)
// ============================================================================
const aplicarTema = (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    themeToggle.textContent = tema === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', tema);
};

const cargarTema = () => {
    const guardado = localStorage.getItem('theme');
    const preferido = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    aplicarTema(guardado || preferido);
};

themeToggle.addEventListener('click', () => {
    const actual = document.documentElement.getAttribute('data-theme');
    aplicarTema(actual === 'dark' ? 'light' : 'dark');
});

cargarTema();



/* parte 1 */
const obtenerSeriesPopulares = async () => {
    const url = `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=es-ES`;
    const respuesta = await fetch(url);
    
    if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    
    const datos = await respuesta.json();
    return datos.results;
};


const iniciar = async () => {
    mostrarLoading();
    
    try {
        const series = await obtenerSeriesPopulares();
        ocultarLoading();
        seriesGrid.innerHTML = series.map(crearTarjeta).join('');
    } catch (error) {
        let mensaje = 'No se pudieron cargar las series';
        console.log('Error:', error);
        if (error.message.includes('401')) {
            console.log('API KEY invalida');
            mensaje = 'API KEY invalida';
        }
        else if (error instanceof TypeError || error.message.includes('fetch') || error.message.includes('NetworkError')) {
            mensaje = 'error de conexion';
            console.log('error de conexion');
        }
        mostrarError(mensaje);
    }
};

retryBtn.addEventListener('click', iniciar);

iniciar();


/* parte 2 */
const crearTarjeta = (serie) => {
    const { id,name, first_air_date, vote_average, poster_path } = serie;
    const anio = first_air_date ? first_air_date.split('-')[0] : 'N/A';
    const imagenUrl = poster_path ? `${IMAGE_URL}${poster_path}` : '';
    const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
    
    return `
    <article class="serie-card" data-id="${id}">
        <div class="serie-card__poster">
            ${imagenUrl ? `<img class="serie-card__image" src="${imagenUrl}" alt="${name}">` : ''}
            <span class="serie-card__rating">${rating}</span>
        </div>
        <div class="serie-card__content">
            <h3 class="serie-card__title">${name}</h3>
            <p class="serie-card__year">${anio}</p>
        </div>
    </article>
    `;
};

/* parte 3 */
const buscarSeries = async(texto)=>{
    if (!texto || texto.trim()==='') {
        return obtenerSeriesPopulares();
    }
    const query = encodeURIComponent(texto.trim());
    const url = `${BASE_URL}/search/tv?api_key=${API_KEY}&language=es-ES&query=${query}`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const datos =await respuesta.json();
    return datos.results;
};
let timeoutBusqueda =null;

const manejarBusqueda =(evento) =>{
    const texto = evento.target.value;
    clearTimeout(timeoutBusqueda);

    timeoutBusqueda = setTimeout(async () => {
        mostrarLoading();
        try {
            const series= await buscarSeries(texto);
            ocultarLoading();
            if (series.length === 0) {
                seriesGrid.innerHTML = `
                <p>No se encontraron series para: "${texto}"</p>`;
                return;
            }
            seriesGrid.innerHTML = series.map(crearTarjeta).join('');
        } catch (error) {
            mostrarError('Error al buscar las series');
        }
    },600);
};

searchInput.addEventListener('input', manejarBusqueda);

clearBtn.addEventListener('click', async () => {
    searchInput.value = '';
    mostrarLoading();
    try {
        const series = await obtenerSeriesPopulares();
        ocultarLoading();
        seriesGrid.innerHTML = series.map(crearTarjeta).join('');
    } catch (error) {
        let mensaje = 'No se pudieron cargar las series';
        console.log('Error:', error);
        if (error.message.includes('401')) {
            console.log('API KEY invalida');
            mensaje = 'API KEY invalida';
        }
        else if (error instanceof TypeError || error.message.includes('fetch') || error.message.includes('NetworkError')) {
            mensaje = 'error de conexion';
            console.log('error de conexion');
        }
        mostrarError(mensaje);
    }
});

/* parte 4 */
const abrirModal=async(idSerie)=>{
    try {
        const url =`${BASE_URL}/tv/${idSerie}?api_key=${API_KEY}&language=es-ES`;
        const respuesta = await fetch(url);
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        const serie=await respuesta.json();
        const generos=serie.genres ? serie.genres.map(g =>g.name).join(', '):'N/A';
        modalBody.innerHTML =`
            <h2 class="modal__title">${serie.name}</h2>
            <p class="modal__subtitle">${serie.tagline || ''}</p>
            <p class="modal__overview">${serie.overview || 'Sin sinopsis.'}</p>
            <div class="modal__info">
                <span><strong>Temporadas:</strong> ${serie.number_of_seasons || 'N/A'}</span>
                <span><strong>Episodios:</strong> ${serie.number_of_episodes || 'N/A'}</span>
                <span><strong>Géneros:</strong> ${generos || 'N/A'}</span>
                <span><strong>Estado:</strong> ${serie.status || 'N/A'}</span>
            </div>
        `;
        modal.classList.add('modal--show');
    } catch(error){
        console.error('Error al cargar detalles de la serie', error);
    }
};

const cerrarModal=()=>{
    modal.classList.remove('modal--show');
};

modalClose.addEventListener('click', cerrarModal);
modalOverlay.addEventListener('click', cerrarModal);
seriesGrid.addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('.serie-card');
    if (tarjeta) {
        const idSerie = tarjeta.dataset.id;
        if (idSerie) {
            abrirModal(idSerie);
        }
    }
});

