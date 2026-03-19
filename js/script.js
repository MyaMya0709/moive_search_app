const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const movieList = document.querySelector("#movieList");
const message = document.querySelector("#message");

const API_KEY = "2c9cebd2";
const BASE_URL = `http://www.omdbapi.com/?i=tt3896198&apikey=${API_KEY}`;

searchButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter"){
        handleSearch();
    }
})

async function handleSearch() {
    const keyword = searchInput.value.trim();

    if (!keyword) {
        message.textContent = "검색어를 입력하세요."
        movieList.innerHTML = "";
        return;
    }

    message.textContent = "검색 중입니다...";
    movieList.innerHTML = "";

    await fetchMovies(ketword);
}

async function fetchMovies(ketword) {
    try {
        const response = await fetch(`${BASE_URL}&s=${encodeURIComponent(keyword)}`);
        const data = await response.json();

        if (data.Response === "False") {
            message.textContent = data.Error || "검색 결과가 없습니다.";
            movieList.innerHTML = "";
            return;
        }

        message.textContent = `"${keyword}" 검색 결과`;
        renderMovies(data.Search);
    }
    catch (error) {
        console.error(error);
        message.textContent = "에러가 발생했습니다. 잠시 후 다시 시도해주세요.";
        movieList.innerHTML = "";
    }

    // const mockData = [
    // {
    //    Title: "Avengers: Endgame",
    //    Year: "2019",
    //    Type: "movie",
    //    Poster: "https://via.placeholder.com/300x450?text=Avengers",
    // },
    // {
    //    Title: "Avengers: Infinity War",
    //    Year: "2018",
    //    Type: "movie",
    //    Poster: "https://via.placeholder.com/300x450?text=Infinity+War",
    // },
    // ];

    // message.textContent = `"${keyword}" 검색 결과`;
    // renderMovies(mockData);
}

function renderMovies(movies) {
    movieList.innerHTML = "";

    movies.ForEach((movie) => {
        const poster = 
            movie.Poster && movie.Poster !== "N/A"
                ? movie.Poster
                : "https://placehold.co/300x450?text=No+Image"
        const movieCard = `
            <article class="movie-card">
                <img class="movie-poster" src="${poster}" alt="${movie.Title} 포스터" />
                <h3>${movie.Title}</h3>
                <p>개봉년도: ${movie.Year}</p>
                <p>타입: ${movie.Type}</p>
            </article>
        `;

        movieList.innerHTML += movieCard;
    })
}