'use strict';





class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on 
        ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this._setDescription();
        this.calcPace();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration, elevationGain);
        this.elevationGain = elevationGain;
        this._setDescription();
        this.calcSpeed();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }

}


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {

    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        this._getLocalStorage();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElivationFeild);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this)), function () {
                alert('could not get your position')
            }
        };
    }

    _loadMap(position) {
        const { latitude } = position.coords;
        const { longitude } = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        //Handling clicks on Map
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work =>{
            this._renderWorkoutMarker(work)
        })
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');

        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _toggleElivationFeild() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {

        const validInput = (...input) => input.every(inp => Number.isFinite(inp));
        const allPositive = (...input) => input.every(inp => inp > 0);

        e.preventDefault();

        //Get the data from FORM
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        //check if data is valid

        // If workout running, create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            //check if the data is valid
            if (!validInput(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence))
                return alert('Input have to be positive Number!!');

            workout = new Running([lat, lng], distance, duration, cadence)
        }

        // If workout Cycling, create Cycling object
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            //check if the data is valid
            if (!validInput(distance, duration, elevationGain) ||
                !allPositive(distance, duration))
                return alert('Input have to be positive Number!!');

            workout = new Cycling([lat, lng], distance, duration, elevationGain)
        }

        //Add new object to workout array
        this.#workouts.push(workout)

        //Render workout on Map as marker
        this._renderWorkoutMarker(workout);

        //Render workout on list
        this._renderWorkout(workout);

        //Hide + clear Input fields
        this._hideForm()

        //set local storage
        this._setLocalStorage();


    }
    _renderWorkoutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;
        if (workout.type === 'running') {
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
        }
        if (workout.type === 'cycling') {
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
        }
        form.insertAdjacentHTML('afterend', html);
    }
    _moveToPopup(e) {
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
    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data) return

        this.#workouts = data;

        this.#workouts.forEach(work =>{
            this._renderWorkout(work)
        })
    }
    reset(){
        localStorage.removeItem('workouts');
    }
}

const app = new App();


