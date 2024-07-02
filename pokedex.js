document.addEventListener('DOMContentLoaded', () => {
    const pokemonList = document.getElementById('pokemon-list');
    const pokemonImg = document.getElementById('pokemon-img');
    const pokemonTypes = document.getElementById('pokemon-types');
    const pokemonDescription = document.getElementById('pokemon-description');
    const pokemonName = document.getElementById('pokemon-name');
    const searchInput = document.getElementById('search-input');
    const abilitiesButton = document.getElementById('abilities-button');
    const formSelect = document.getElementById('form-select');
    const formText = document.getElementById('pokemon-forms');
    const damageButton = document.getElementById('damage-relations');
    const movesButton = document.getElementById('moves-button');
    const reloadButton = document.getElementById('reload-button');

    let allPokemon = [];
    let currentPokemonDetails = null;

    // Fetch a list of Pokémon names and URLs
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
        .then(response => response.json())
        .then(data => {
            allPokemon = data.results;
            displayPokemonList(allPokemon);
        })
        .catch(error => console.error('Error fetching Pokémon list:', error));
    // Display the list of Pokémon
    function displayPokemonList(pokemonArray) {
        pokemonList.innerHTML = '';
        pokemonArray.forEach(pokemon => {
            const pokemonItem = document.createElement('div');
            pokemonItem.textContent = pokemon.name;
            pokemonItem.classList.add('pokemon-item');
            pokemonItem.addEventListener('click', () => {
                loadPokemonDetails(pokemon.url);
            });
            pokemonList.appendChild(pokemonItem);
        });
    }
    
    // Load Pokémon details when a Pokémon is clicked
    function loadPokemonDetails(url) {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                currentPokemonDetails = data;
                updatePokemonDisplay(data);

                // Fetch the Pokémon species data for the description and forms
                fetch(data.species.url)
                    .then(response => response.json())
                    .then(speciesData => {
                        const flavorTextEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
                        const sanitizedDescription = sanitizeDescription(flavorTextEntry ? flavorTextEntry.flavor_text : 'No description available.');
                        pokemonDescription.textContent = sanitizedDescription;

                        // Fetch and display forms
                        displayPokemonForms(speciesData.varieties, data.name);
                        // Show the buttons and form selection
                        showElements();
                    })
                    .catch(error => console.error('Error fetching Pokémon species details:', error));
            })
            .catch(error => console.error('Error fetching Pokémon details:', error));
    }
    // Sanitize Pokémon description (remove unwanted formatting characters)
    function sanitizeDescription(description) {
        return description.replace(/[\u25B2\u25BC]/g, ''); // Replace all up arrows (^)
    }
    // Update the Pokémon display
    function updatePokemonDisplay(data) {
        pokemonName.textContent = data.name.toUpperCase(); // Set the Pokémon name
        pokemonImg.src = data.sprites.other['official-artwork'].front_default; // Set the sprite image
        pokemonTypes.innerHTML = '';
        data.types.forEach(typeInfo => {
            const typeSpan = document.createElement('span');
            typeSpan.classList.add('type-box', typeInfo.type.name);
            typeSpan.textContent = typeInfo.type.name.toUpperCase();
            pokemonTypes.appendChild(typeSpan);
        });
    }

    // Display Pokémon forms in a dropdown
    function displayPokemonForms(varieties, selectedForm) {
        formSelect.innerHTML = ''; // Clear previous options
        varieties.forEach(variety => {
            const option = document.createElement('option');
            option.value = variety.pokemon.url;
            option.textContent = variety.pokemon.name;
            option.selected = variety.pokemon.name === selectedForm;
            formSelect.appendChild(option);
        });

        // Load the selected form when an option is selected
        formSelect.removeEventListener('change', handleFormChange); // Remove previous event listener if any
        formSelect.addEventListener('change', handleFormChange);
    }

    // Handle form change
    function handleFormChange(event) {
        loadPokemonDetails(event.target.value);
    }

    // Filter Pokémon list based on search input
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredPokemon = allPokemon.filter(pokemon => pokemon.name.toLowerCase().includes(searchTerm));
        displayPokemonList(filteredPokemon);
    });

    // Load Pokémon abilities when the abilities button is clicked
    abilitiesButton.addEventListener('click', () => {
        if (currentPokemonDetails) {
            pokemonDescription.innerHTML = ''; // Clear the previous description
            currentPokemonDetails.abilities.forEach(abilityInfo => {
                fetch(abilityInfo.ability.url)
                    .then(response => response.json())
                    .then(abilityData => {
                        const abilityText = document.createElement('p');
                        const abilityEffect = abilityData.effect_entries.find(entry => entry.language.name === 'en');
                        abilityText.textContent = `${abilityInfo.ability.name.toUpperCase()}: ${abilityEffect ? abilityEffect.effect : 'No description available.'}`;
                        pokemonDescription.appendChild(abilityText);
                    })
                    .catch(error => console.error('Error fetching ability details:', error));
            });
        }
    });
    // Load Pokémon damage relations when the damage button is clicked
    damageButton.addEventListener('click', () => {
        if (currentPokemonDetails) {
            pokemonDescription.innerHTML = ''; // Clear the previous description

            // Fetch damage relations for each type of the Pokémon
            const typePromises = currentPokemonDetails.types.map(typeInfo => 
                fetch(typeInfo.type.url).then(response => response.json())
            );
            Promise.all(typePromises)
                .then(typeDataArray => {
                    typeDataArray.forEach(typeData => {
                        const typeText = document.createElement('div');
                        typeText.innerHTML = `<strong>${typeData.name.toUpperCase()}</strong><br>`;
                        typeText.innerHTML += `Double damage from: ${typeData.damage_relations.double_damage_from.map(t => t.name).join(', ') || 'None'}<br>`;
                        typeText.innerHTML += `Double damage to: ${typeData.damage_relations.double_damage_to.map(t => t.name).join(', ') || 'None'}<br>`;
                        typeText.innerHTML += `Half damage from: ${typeData.damage_relations.half_damage_from.map(t => t.name).join(', ') || 'None'}<br>`;
                        typeText.innerHTML += `Half damage to: ${typeData.damage_relations.half_damage_to.map(t => t.name).join(', ') || 'None'}<br>`;
                        typeText.innerHTML += `No damage from: ${typeData.damage_relations.no_damage_from.map(t => t.name).join(', ') || 'None'}<br>`;
                        typeText.innerHTML += `No damage to: ${typeData.damage_relations.no_damage_to.map(t => t.name).join(', ') || 'None'}`;
                        pokemonDescription.appendChild(typeText);
                    });
                })
                .catch(error => console.error('Error fetching type details:', error));
        }
    });
    // Load Pokémon moves when the moves button is clicked
    movesButton.addEventListener('click', () => {
        if (currentPokemonDetails) {
            pokemonDescription.innerHTML = ''; // Clear the previous description

            // Filter moves that can be learned by level up or HM/TM
            const levelUpMoves = currentPokemonDetails.moves.filter(move => {
                return move.version_group_details.some(detail => {
                    const method = detail.move_learn_method.name;
                    return method === 'level-up' || method === 'machine';
                });
            });

            // Fetch and display filtered moves
            levelUpMoves.forEach(moveInfo => {
                fetch(moveInfo.move.url)
                    .then(response => response.json())
                    .then(moveData => {
                        const moveText = document.createElement('p');
                        moveText.textContent = `${moveData.name.toUpperCase()} - Method: ${getMoveLearnMethod(moveInfo.version_group_details)}`;
                        pokemonDescription.appendChild(moveText);
                    })
                    .catch(error => console.error('Error fetching move details:', error));
            });
        }
    });

    // Helper function to get move learn method
    function getMoveLearnMethod(versionGroupDetails) {
        const method = versionGroupDetails.find(detail => detail.move_learn_method.name === 'machine' || detail.move_learn_method.name === 'level-up');
        return method ? method.move_learn_method.name.replace('-', ' ').toUpperCase() : 'Unknown';
    }
    reloadButton.addEventListener('click',() => {
        document.location.reload();
    });
    // Show elements function
    function showElements() {
        abilitiesButton.classList.remove('hidden');
        damageButton.classList.remove('hidden');
        movesButton.classList.remove('hidden');
        formSelect.classList.remove('hidden');
        formText.classList.remove('hidden')
    }
});
