const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const movieList = document.querySelector("#movieList");
const message = document.querySelector("#message");

const movieModal = document.querySelector("#movieModal");
const modalBody = document.querySelector("#modalBody");
const closeModalButton = document.querySelector("#closeModalButton");
const modalOverlay = document.querySelector(".modal-overlay");

const API_KEY = "2c9cebd2";
const BASE_URL = `https://www.omdbapi.com/?apikey=${API_KEY}`;

searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        handleSearch();
    }
});

movieList.addEventListener("click", (event) => {
  const movieCard = event.target.closest(".movie-card");

  if (!movieCard) {
    return;
  }

  const imdbID = movieCard.dataset.id;
  fetchMovieDetail(imdbID);
});

closeModalButton.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !movieModal.classList.contains("hidden")) {
        closeModal();
    }
});

function setMessage(text) {
    message.textContent = text;
}

function openModal() {
  movieModal.classList.remove("hidden");
}

function closeModal() {
  movieModal.classList.add("hidden");
}

function createPosterMarkup(poster, title, posterClassName) {
    const hasPoster = poster && poster !== "N/A";

    const posterUrl = hasPoster
        ? poster
        : "https://placehold.co/300x450?text=No+Image";

    return `
        <img
            class="${posterClassName}"
            src="${posterUrl}"
            alt="${title} 포스터"
            onerror="this.src='https://placehold.co/300x450?text=No+Image'; this.onerror=null;"
        />
    `;
}

function createMovieCard(movie){
    const posterMarkup = createPosterMarkup(
        movie.Poster,
        movie.Title,
        "movie-poster"
    )

    return `
        <article class="movie-card" data-id="${movie.imdbID}">
            ${posterMarkup}
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <p class="movie-meta">개봉연도: ${movie.Year}</p>
                <p class="movie-meta">타입: ${movie.Type}</p>
            </div>
        </article>
    `;
}

function renderEmptyState(text){
    movieList.innerHTML = `
        <div class="empty-box">
            ${text}
        </div>
    `;
}

function renderMovies(movies) {
    if(!movies || movies.length === 0) {
        renderEmptyState("검색 결과가 없습니다.");
        return;
    }

    movieList.innerHTML = movies.map(createMovieCard).join("");
}

function renderMovieDetail(movie){
    const posterMarkup = createPosterMarkup(
        movie.Poster,
        movie.Title,
        "modal-detail-poster"
    );

    modalBody.innerHTML = `
        <div class="modal-detail">
        <div>
            ${posterMarkup}
        </div>

        <div>
            <h2 id="modalTitle" class="modal-title">${movie.Title}</h2>
            <p class="modal-meta"><strong>개봉:</strong> ${movie.Released}</p>
            <p class="modal-meta"><strong>장르:</strong> ${movie.Genre}</p>
            <p class="modal-meta"><strong>감독:</strong> ${movie.Director}</p>
            <p class="modal-meta"><strong>배우:</strong> ${movie.Actors}</p>
            <p class="modal-meta"><strong>평점:</strong> ${movie.imdbRating}</p>
            <p class="modal-meta"><strong>상영시간:</strong> ${movie.Runtime}</p>
            <p class="modal-plot"><strong>줄거리:</strong> ${movie.Plot}</p>
        </div>
        </div>
    `;
}

async function handleSearch() {
    const keyword = searchInput.value.trim();

    if (!keyword) {
        message.textContent = "검색어를 입력하세요."
        movieList.innerHTML = "";
        return;
    }

    message.textContent = "검색 중입니다...";
    movieList.innerHTML = "";

    await fetchMovies(keyword);
}

async function fetchMovies(keyword) {
    try {
        const response = await fetch(
            `${BASE_URL}&s=${encodeURIComponent(keyword)}`
        );
        const data = await response.json();
        
        if (data.Response === "False") {
            const errorText = data.Error || "검색 결과가 없습니다.";
            setMessage(errorText);
            renderEmptyState(errorText);
            return;
        }
        
        setMessage(`"${keyword}" 검색 결과`);
        renderMovies(data.Search);
    }
    catch (error) {
        console.error(error);
        setMessage("에러가 발생했습니다. 잠시 후 다시 시도해주세요.");
        renderEmptyState("에러가 발생했습니다.");
    }
}


async function fetchMovieDetail(imdbID) {
    try{
        modalBody.innerHTML = `<p>상세정보를 불러오는 중입니다...</p>`;
        openModal();

        const response = await fetch(
            `${BASE_URL}&i=${imdbID}&plot=full`
        );
        const data = await response.json();

        if(data.Response === "False"){
            modalBody.innerHTML = `<p>상세정보를 불러오지 못했습니다.</p>`;
            return;
        }

        renderMovieDetail(data);
    }
    catch(error){
        console.error(error);
        modalBody.innerHTML = `<p>에러가 발생했습니다. 잠시 후 다시 시도해주세요.</p>`;
    }
}