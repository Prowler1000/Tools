<script lang="ts">
    const max_planet_gear_calc = 10;

    let lock: 'sun' | 'planet' | 'ring' = $state('ring');

    let sun_locked = $derived(lock === 'sun');
    let planet_locked = $derived(lock === 'planet');
    let ring_locked = $derived(lock === 'ring');


    let ratio_in = $state(1);
    let ratio_out = $state(3);

    let ratio = $derived(ratio_in/ratio_out);

    let sun_gear_teeth = $state(13);

    let ring_gear_teeth = $derived.by(() => {
        if (ring_locked) {
            return ((ratio_out/ratio_in) * sun_gear_teeth) - sun_gear_teeth;
        }
        else if (planet_locked) {
            return ((ratio_out/ratio_in) * sun_gear_teeth);
        }
        else if (sun_locked) {
            return -(sun_gear_teeth / ((ratio_in/ratio_out)-1));
        }
        return 0;
    });
    let planet_gear_teeth = $derived((ring_gear_teeth - sun_gear_teeth)/2);
    let number_planet_gears = $derived.by(() => {
        if (planet_gear_teeth == 0) return [];
        let num_gears = [1,];
        let teeth_total = ring_gear_teeth + sun_gear_teeth;
        for (let i = 0; i < max_planet_gear_calc; i++) {
            if (teeth_total % (i+2) == 0) {
                num_gears.push(i+2);
            }
        }
        return num_gears;
    });

    function calc_from_ring_gear(num_teeth: number) {
        let sun_teeth = num_teeth / ((1/ratio) - 1); // Prevent issues with accessing sun_gear_teeth later
        if (ratio == 1) sun_teeth = num_teeth;
        sun_gear_teeth = sun_teeth;
    }

</script>

<div class="container">
    <div class="calculator">
        <div class="ratio">
            <div class="ratio-input">
                <input type="number" value={ratio_in} oninput={(e) => ratio_in = Number(e.currentTarget.value)}/> :
                <input type="number" value={ratio_out} oninput={(e) => ratio_out = Number(e.currentTarget.value)}/>
            </div>
            {ratio.toFixed(3)}
        </div>
        <div class="gear-data">
            <div class="gear-inputs">
                <div class="gear-input">
                    <label for="sun-gear">Sun Gear Teeth:</label>
                    <input id="sun-gear" value={sun_gear_teeth} type="number" oninput={(e) => sun_gear_teeth = Number(e.currentTarget.value)}/>
                </div>
                <div class="gear-input">
                    <label for="ring-gear">Ring Gear Teeth:</label>
                    <input id="ring-gear" value={ring_gear_teeth} type="number" oninput={(e) => calc_from_ring_gear(Number(e.currentTarget.value))}/>
                </div>
            </div>
            <div class="lock-selector">
                <div class="lock-option">
                    <input type="radio" name="lock" id="lock-sun" value="sun" checked={sun_locked} onchange={() => lock = 'sun'} />
                    <label for="lock-sun">Lock Sun Gear</label>
                </div>
                <div class="lock-option">
                    <input type="radio" name="lock" id="lock-planet" value="planet" checked={planet_locked} onchange={() => lock = 'planet'} />
                    <label for="lock-planet">Lock Planet Carrier</label>
                </div>
                <div class="lock-option">
                    <input type="radio" name="lock" id="lock-ring" value="ring" checked={ring_locked} onchange={() => lock = 'ring'} />
                    <label for="lock-ring">Lock Ring Gear</label>
                </div>

            </div>
        </div>
        <div class="calculations">
            <div class="results">
                <p><strong>Ratio:</strong> {ratio.toFixed(3)}</p>
                <p><strong>Sun Gear Teeth:</strong> {sun_gear_teeth}</p>
                <p><strong>Ring Gear Teeth:</strong> {ring_gear_teeth.toFixed(0)}</p>
                <p><strong>Planet Gear Teeth:</strong> {planet_gear_teeth.toFixed(0)}</p>
                <p><strong>Valid Number of Planetary Gears:</strong> {number_planet_gears.join(', ')}</p>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .calculator {
        width: 100%;
        display: flex;
        justify-content: center;
        flex-direction: column;
    }
    .ratio {
        display: flex;
        flex-direction: column;
        text-align: center;
    }
    .ratio input {
        width: 2em;
        text-align: center;
        -moz-appearance: textfield;
        appearance: textfield;
    }
    .ratio input::-webkit-outer-spin-button,
    .ratio input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .ratio-input {
        display: flex;
        justify-content: center;
    }

    .lock-selector {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
    }

    .lock-option {
        display: flex;
        justify-content: center;
        padding-left: 3em;
        user-select: none;
    }

    .lock-option label {
        flex: 0 0 10em; /* Fixed width for labels, adjust as needed */
        text-align: left; /* Align text to the right */
    }

    .gear-inputs {
        display: flex;
        flex-direction: column;
        align-items: center; /* Align gear-inputs to the left */
        margin-top: 1em;
        width: 100%; /* Ensure it spans the full width of the parent */
    }

    .gear-input {
        display: flex;
        align-items: center; /* Vertically align items */
        justify-content: center;
        padding-right: 160px;
        margin-bottom: 0.5em;
        width: 100%; /* Allow inputs to align uniformly */
    }

    .gear-input label {
        flex: 0 0 10em; /* Fixed width for labels, adjust as needed */
        text-align: right; /* Align text to the right */
        padding-right: 0.5em; /* Add spacing after the label */
    }

    .gear-input input[type="number"] {
        width: 4em;
        text-align: center;
        -moz-appearance: textfield;
        appearance: textfield;
        margin-right: 0.5em; /* Add spacing between inputs */
    }

    .gear-input input[type="number"]::-webkit-outer-spin-button,
    .gear-input input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .gear-input input[type="checkbox"] {
        width: 1.5em; /* Adjust checkbox size */
        height: 1.5em;
        margin-left: 0.5em; /* Add spacing before checkbox */
    }


    .results {
        margin-top: 1em;
        text-align: center;
    }
    .results p {
        margin: 0.5em 0;
    }

</style>