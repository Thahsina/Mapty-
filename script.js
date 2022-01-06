"use strict";

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.distance = distance;
    this.coords = coords;
    this.duration = duration;
  }

  _setDescription(){
      //prettier-ignore
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}  ${this.date.getDate()}`;

  }


  click() {
    this.clicks++;
  }
}

class Running extends Workout {
    type = 'running'
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription()
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
    type = 'cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription()
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//-------------------APPLICATION ARCHITECTURE--------------------//

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

// let map, mapEvent;

class App {
  // Private instance properties. These properties will avalible on all the instances/occurrence of this app class
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  constructor() {
    this._getPosition();

    this._getLocalStorage();



    // form.addEventListener("submit", this._newWorkout);
    // this keyword in eventListner points to the element upon which eventlistener is attached. In this case its form & no longer to app, we fix this with bind method
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationFeild);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      // _loadMap method is called by getCurrentPosition() ,so _loadMap is treated as a regular function call not as a method call. In regular function call this keyword is set to undefined. So we manually bind the this keyword to the currnt object(app).So this keyword is what want inside the _loadMap().
      // binds returns a new function
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    //L is the nameSpace of leaftet library
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    // 13 is the zoom effect number of initial map
    // console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work);
      });
  }


_hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
    '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
}

_showForm(mapE) {
    this.#mapEvent = mapE;
    console.log(mapE);
    form.classList.remove("hidden");
    inputDistance.focus();
    }

    _toggleElevationFeild() {
    //toggling the running to cadence N cycling to Elev Gai
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {
        
    e.preventDefault();

    //Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout; //just a variable not Workout class

    //Check if data is valid
    //Helper functions
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
    const allPositive = (...inputs) => inputs.every(inp => inp > 0)

    //If Activity is running create a running object
    if(type === 'running'){
        const cadence = +inputCadence.value
        if(!validInputs(distance,duration,cadence)|| !allPositive(distance,duration,cadence))
            return alert('Inputs have to be positive numbers!')
        
        workout = new Running([lat, lng], distance, duration, cadence)
        

    }

    //if the activity is cycling create a cycling object
    if(type === 'cycling'){
        const elevation = +inputElevation.value
        if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration))
            return alert('Inputs have to be positive numbers!')

        workout = new Cycling([lat, lng], distance, duration, elevation)
        
    }

    //Add new object to workout array
  this.#workouts.push(workout)
  console.log(workout);
  
    //Render workout on map as marker
    this._renderWorkoutMarker(workout)

    //Render the workouts on the list
    this._renderWorkout(workout);

    //Hide form
    this._hideForm();


    //clear input fields

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

     // Set local storage to all workouts
    this._setLocalStorage();

    
  }


  _renderWorkoutMarker(workout){
    L.marker(workout.coords)
  .addTo(this.#map)
  .bindPopup(
    L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    })
  )
  .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
  .openPopup();
}

_renderWorkout(workout){
    let html =`
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
        <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
    </div>`;

    if(workout.type === 'running')
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

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);

}

_moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

}


_setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}



const app = new App();
