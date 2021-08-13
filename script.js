"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

//Parent class
class Workout {
  date = new Date();
  id = Date.now() + "".slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;

    // //calling childclass functions
    // this.calPace();
    // this.calSpeed();
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

//child classes

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calPace();
    this._setDescription();
  }

  //calculating the pace in min/km
  calPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calSpeed();
    this._setDescription();
  }

  //calculating speed in km/hr
  calSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 5.2, 24, 178);
// console.log(run1, cycling1);

//Selecting the elements

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  //making map and mapEvent private properties of the class
  #map;
  #mapEvent;
  #workouts = []; //array to store all the workouts

  //defining methods of the class App
  constructor() {
    //get user's position
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();

    //adding submit event listener to form and calling _newWorkout()
    form.addEventListener("submit", this._newWorkout.bind(this));

    //event listener to change candence and elevation when switching from running to cycling
    inputType.addEventListener("change", this._toggleElevationField);

    //no need to use bind() as the function code does not contain this keyword
  } //end of the constructor()

  _getPosition() {
    //using the geolocation API to get user's current position

    if (navigator.geolocation)
      //as we are inside the class App we have to use this keyword to call _loadMap()
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Sorry! Unable to get your position😓");
        }
      );
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    //clear the input values
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        "";

    inputType.value = "running";

    //hide the form
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //adding clicks event listener on the map using leaflet library
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInput = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //to prevent default reloading of page when clicked enter on form
    e.preventDefault();

    //get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    //if workout is running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      //check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)

        !validInput(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Kindly enter a positive number!");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout is cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInput(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Kindly enter a positive number!");

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //hide form and clear input fields
    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    //to add and display location pin marker to the map
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 150,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      //writing what the popup should display before opening the popup
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♀️" : "🚴‍♀️"}${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♀️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏳</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
      </li>
       `;

    if (workout.type === "cycling")
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}
        </span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;

    form.insertAdjacentHTML("afterend", html);
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

//creating object of App class to call the functions
const app_obj = new App();
