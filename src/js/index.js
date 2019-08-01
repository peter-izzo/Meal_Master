//Global app controller

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of app
* - Search object
* - Current recipe object
* - Shopping list object
* - Liked recipes
*/
const state = {};
window.state=state;

/**
*SEARCH CONTROLLER
*
*/
const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput;

    if (query) {
        // 2. New search object and add to state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
          // 4. Search for recipes
          await state.search.getResults();

          // 5. Render results on UI
          clearLoader();
          searchView.renderResults(state.search.result);
        } catch(err) {
          alert('Something wrong with the search...');
          clearLoader();
        }
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
      const goToPage = parseInt(btn.dataset.goto, 10);
      searchView.clearResults();
      searchView.renderResults(state.search.result, goToPage);
      console.log(goToPage);
  }
});


/**
*RECIPE CONTROLLER
*
*/
const controlRecipe = async () => {
  //Get ID from urk
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if(id) {
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search recipe__item
        if (state.search) searchView.highlightedSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);

        try {
          //Get recipe data and parse ingredients
          await state.recipe.getRecipe();
          state.recipe.parseIngredients();

          //Calculate servings and time
          state.recipe.calcTime();
          state.recipe.calcServings();

          //Render recipe
          clearLoader();
          recipeView.renderRecipe(state.recipe);

        } catch (err) {
            alert('Error prosessing recipe');
        }
    }
};


['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
* LIST CONTROLLER
*/
const controlList = () => {
    // Create new list if none yet
    if (!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //HAndle the delte button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);

        //delete from UI
        listView.deleteItem(id);

    //Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        let val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
            if (val < 0 && e.target.value < 0) {
                window.alert('List values cannot be less than 0')
                state.list.updateCount(id, val=0);
            };
    }
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredient(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
          // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredient(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
            //add ingredients to shopping list
        controlList();
    }
});

window.l = new List();
