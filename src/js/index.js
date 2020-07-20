import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';


/**GLOBAL STATE OF THE APP 
 * - Search Object
 * - Current Recipe Object
 * - Shopping list object
 *  - Like Recipies
*/

const state = {};


//SEARCH CONTROLLER
const controlSearch = async () => {
    //1)  Get the query from the view
    const query = searchView.getInput() //TODO
    if(query){
        // 2) New Search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        
        try{
            // 4) Search for recipes
            await state.search.getResults();
            
            
            // 5) Render results on UI;
            clearLoader();
            searchView.renderResults(state.search.result);
            
        }catch(err){
            clearLoader();
            alert('Error Searching Recipes');

        }

    }
    

}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


//RECIPE CONSTROLLER

const controlRecipe = async () => {
    const id = window.location.hash.replace('#', '');
    if(id){
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if(state.search){
            searchView.highlightSelected(id);
        }

        // create new recipe object
        state.recipe = new Recipe(id);
        
        try{
            // get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            
            // Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        }catch( error ){
            console.error(error)
            alert('Error processing recipe!');
        }
    }
    
}

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

const controlList = () => {
    // create a new list if is none yet
    if(!state.list) state.list = new List();

    //add each ingredient to the list and UI
    listView.clearShopping();
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //User has not yer liked current recipe
    if(!state.likes.isLiked(currentID)){
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeButton(true);
        // Add like to UI list
        likesView.renderLike(newLike);
    //User has liked current recipe    
    }else{
        //Remove like from the state
        state.likes.delete(currentID);
         // Toggle the like button
        likesView.toggleLikeButton(false);
        // remove like to UI list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());

}

// Handle delete add update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state
        state.list.deleteItem(id);
        listView.deleteItem(id);
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
});

window.addEventListener('load', () => {
    state.likes = new Likes();
    state.likes.readStorage();
    
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    state.likes.likes.forEach(like => likesView.renderLike(like));

});

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease * ')){
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }else if(e.target.matches('.btn-increase, .btn-increase * ')){
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *' )){
        controlLike();

    }

});