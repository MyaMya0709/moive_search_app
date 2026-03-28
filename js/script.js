const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const movieList = document.querySelector("#movieList");
const message = document.querySelector("#message");

const recentKeywords = document.querySelector("#recentKeywords");
const clearRecentButton = document.querySelector("#clearRecentButton");

const movieModal = document.querySelector("#movieModal");
const modalBody = document.querySelector("#modalBody");
const closeModalButton = document.querySelector("#closeModalButton");
const modalOverlay = document.querySelector(".modal-overlay");

const TMDB_BEARER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NmIzOTgxNTUwZGQxMWQyNzc5MzM1N2NmZjhkNTA5YyIsIm5iZiI6MTc3NDY4MzMyNi4wNzIsInN1YiI6IjY5Yzc4NGJlNzY3MTcxZDE4MWM4MGE4MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3CO5NRUu24vJyCuPoSwcpGokchym2DORbZ62kTu81A0";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const RECENT_SEARCH_KEY = "movie-search-recent-keywords";
const MAX_RECENT_KEYWORDS = 5;

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

  const movieId = movieCard.dataset.id;
  fetchMovieDetail(movieId);
});

closeModalButton.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !movieModal.classList.contains("hidden")) {
    closeModal();
  }
});

recentKeywords.addEventListener("click", (event) => {
  const chip = event.target.closest(".keyword-chip");
  if (!chip) return;

  const keyword = chip.dataset.keyword;
  searchInput.value = keyword;
  handleSearch();
});

clearRecentButton.addEventListener("click", () => {
  localStorage.removeItem(RECENT_SEARCH_KEY);
  renderRecentKeywords();
});

function setMessage(text) {
  message.textContent = text;
}

function openModal() {
  movieModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeModal() {
  movieModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function createPosterMarkup(posterPath, title, posterClassName) {
  const posterUrl = posterPath
    ? `${IMAGE_BASE_URL}${posterPath}`
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

function createMovieCard(movie) {
  const posterMarkup = createPosterMarkup(
    movie.poster_path,
    movie.title,
    "movie-poster",
  );

  const releaseYear = movie.release_date
    ? movie.release_date.slice(0, 4)
    : "정보 없음";

  return `
    <article class="movie-card" data-id="${movie.id}">
      ${posterMarkup}
        <div class="movie-info">
          <h3 class="movie-title">${movie.title}</h3>
          <p class="movie-meta">개봉연도: ${releaseYear}</p>
          <p class="movie-meta">평점: ${movie.vote_average ?? "정보 없음"}</p>
        </div>
      </article>
    `;
}

function renderEmptyState(text) {
  movieList.innerHTML = `
        <div class="empty-box">
            ${text}
        </div>
    `;
}

function renderMovies(movies) {
  if (!movies || movies.length === 0) {
    renderEmptyState("검색 결과가 없습니다.");
    return;
  }

  movieList.innerHTML = movies.map(createMovieCard).join("");
}

function renderMovieDetail(movie) {
  const posterMarkup = createPosterMarkup(
    movie.poster_path,
    movie.title,
    "modal-detail-poster",
  );

  const genres =
    movie.genres && movie.genres.length > 0
      ? movie.genres.map((genre) => genre.name).join(", ")
      : "정보 없음";

  modalBody.innerHTML = `
		<div class="modal-detail">
			<div>
				${posterMarkup}
			</div>

			<div>
				<h2 id="modalTitle" class="modal-title">${movie.title}</h2>
				<p class="modal-meta"><strong>개봉:</strong> ${movie.release_date || "정보 없음"}</p>
				<p class="modal-meta"><strong>장르:</strong> ${genres}</p>
				<p class="modal-meta"><strong>원제:</strong> ${movie.original_title || "정보 없음"}</p>
				<p class="modal-meta"><strong>평점:</strong> ${movie.vote_average ?? "정보 없음"}</p>
				<p class="modal-meta"><strong>상영시간:</strong> ${movie.runtime ? `${movie.runtime}분` : "정보 없음"}</p>
				<p class="modal-plot"><strong>줄거리:</strong> ${movie.overview || "줄거리 정보가 없습니다."}</p>
			</div>
		</div>
	`;
}

async function handleSearch() {
  const keyword = searchInput.value.trim();

  if (!keyword) {
    message.textContent = "검색어를 입력하세요.";
    movieList.innerHTML = "";
    return;
  }

  message.textContent = "검색 중입니다...";
  movieList.innerHTML = "";
  setSearchLoading(true);
  renderLoadingState();

  await fetchMovies(keyword);
}

async function fetchMovies(keyword) {
  try {
    const response = await fetch(
      `${BASE_URL}/search/movie?query=${encodeURIComponent(keyword)}&language=ko-KR&page=1&include_adult=false`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
        },
      },
    );

    const data = await response.json();

    if (data.Response === "False") {
      const errorText = data.Error || "검색 결과가 없습니다.";
      setMessage(errorText);
      renderEmptyState(errorText);
      return;
    }

    setMessage(`"${keyword}" 검색 결과`);
    saveRecentKeyword(keyword);
    renderMovies(data.results);
  } catch (error) {
    console.error(error);
    setMessage("에러가 발생했습니다. 잠시 후 다시 시도해주세요.");
    renderEmptyState("에러가 발생했습니다.");
  } finally {
    setSearchLoading(false);
  }
}

async function fetchMovieDetail(movieId) {
  try {
    modalBody.innerHTML = `<p>상세정보를 불러오는 중입니다...</p>`;
    openModal();

    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?language=ko-KR`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
        },
      },
    );

    const data = await response.json();

    if (data.success === "False") {
      modalBody.innerHTML = `<p>상세정보를 불러오지 못했습니다.</p>`;
      return;
    }

    renderMovieDetail(data);
  } catch (error) {
    console.error(error);
    modalBody.innerHTML = `<p>에러가 발생했습니다. 잠시 후 다시 시도해주세요.</p>`;
  }
}

function setSearchLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchInput.disabled = isLoading;
  searchButton.textContent = isLoading ? "검색 중..." : "검색";
}

function renderLoadingState() {
  movieList.innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <p class="loading-text">영화 정보를 불러오는 중입니다...</p>
    </div>
  `;
}

function getRecentKeywords() {
  const saved = localStorage.getItem(RECENT_SEARCH_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveRecentKeyword(keyword) {
  const recentList = getRecentKeywords();

  const filtered = recentList.filter(
    (item) => item.toLowerCase() !== keyword.toLowerCase(),
  );

  filtered.unshift(keyword);

  const limited = filtered.slice(0, MAX_RECENT_KEYWORDS);

  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(limited));
  renderRecentKeywords();
}

function renderRecentKeywords() {
  const recentList = getRecentKeywords();

  if (recentList.length === 0) {
    recentKeywords.innerHTML = `
      <p class="empty-recent">최근 검색어가 없습니다.</p>
    `;
    return;
  }

  recentKeywords.innerHTML = recentList
    .map(
      (keyword) => `
        <button
          type="button"
          class="keyword-chip"
          data-keyword="${keyword}"
        >
          ${keyword}
        </button>
      `,
    )
    .join("");
}

renderRecentKeywords();
