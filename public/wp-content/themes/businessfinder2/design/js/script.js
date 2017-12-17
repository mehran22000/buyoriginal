/*
 * AIT WordPress Theme
 *
 * Copyright (c) 2012, Affinity Information Technology, s.r.o. (http://ait-themes.com)
 */
var burgerMenuData = [{selectors: ['.header-container'], reservedSelectors: ['li.menu-item-wrapper']}, {selectors: ['.sticky-menu .grid-main'], reservedSelectors: ['li.menu-item-wrapper', '.sticky-menu .site-logo']}];

/* Main Initialization Hook */
jQuery(document).ready(function(){
var scrollOpts = {
	offset: -66
};
jQuery( ".menu-join" ).click(function() {
	jQuery('html').scrollTo(jQuery('.apps'), 800, scrollOpts);
});
jQuery( ".menu-verify" ).click(function() {
	jQuery('html').scrollTo(jQuery('.main-slideshow'), 800, scrollOpts);
});
jQuery( ".menu-promote" ).click(function() {
	jQuery('html').scrollTo(jQuery('.small-slides'), 800, scrollOpts);
});
jQuery( ".download-app" ).click(function() {
	jQuery('html').scrollTo(jQuery('.apps'), 800, scrollOpts);
});
jQuery( ".menu-search" ).click(function() {
	jQuery('html').scrollTo(jQuery('.site-header'), 800);
});

jQuery('#the-modal').easyModal();



	/* menu.js initialization */
	var mainOpts = {
        //auto-advancing slides? accepts boolean (true/false) or object
        auto : { 
            // speed to advance slides at. accepts number of milliseconds
            speed : 2500, 
            // pause advancing on mouseover? accepts boolean
            pauseOnHover : true 
        },
        // show fullscreen toggle? accepts boolean
        fullScreen : true, 
        // support swiping on touch devices? accepts boolean, requires hammer.js
        swipe : true 
    };
	var adsOpts = {
        //auto-advancing slides? accepts boolean (true/false) or object
        auto : { 
            // speed to advance slides at. accepts number of milliseconds
            speed : 2500, 
            // pause advancing on mouseover? accepts boolean
            pauseOnHover : false 
        },
        // show fullscreen toggle? accepts boolean
        fullScreen : false, 
        // support swiping on touch devices? accepts boolean, requires hammer.js
        swipe : true 
    };
	makeBSS('.main-slideshow', mainOpts);
	makeBSS('.small-slide', adsOpts);
	desktopMenu();
	responsiveMenu();

	prepareBurgerMenus(burgerMenuData);
	burgerMenus(burgerMenuData);
	/* menu.js initialization */

	/* portfolio-item.js initialization */
	portfolioSingleToggles();
	/* portfolio-item.js initialization */

	/* custom.js initialization */
	renameUiClasses();
	removeUnwantedClasses();

	initWPGallery();
	initColorbox();
	initRatings();
	initInfieldLabels();
	initSelectBox();

	notificationClose();
	initCustomScroll();
	/* custom.js initialization */

	/* Theme Dependent Functions */
	// telAnchorMobile();
	headerLayoutSize();
	/* Theme Dependent Functions */
});
/* Main Initialization Hook */

jQuery(window).load(function(){
	//prepareFitMenu();
	//fitMenu();
});

/* Window Resize Hook */
jQuery(window).resize(function(){
	headerLayoutSize();

	burgerMenus(burgerMenuData);
	//fitMenu();
});
/* Window Resize Hook */

/* Theme Dependenent Functions */


function getLatLngFromAddress(address){
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode({'address': address}, function(results, status){
		console.log(status);
		console.log(results[0].geometry.location);
		return results[0].geometry.location;
	});

}

// function telAnchorMobile(){
// 	if (isUserAgent('mobile')) {
// 		jQuery("a.phone").each(function() {
// 			this.href = this.href.replace(/^callto/, "tel");
// 		});
// 	}
// }

function headerLayoutSize(){
	// check for search form version
	if(jQuery('body').hasClass('search-form-type-3')){
		var $container = jQuery('.header-layout');
		var $elementWrap = $container.find('.header-element-wrap');
		var $searchWrap = $container.find('.header-search-wrap');

		if($searchWrap.height() > $elementWrap.height()){
			$container.addClass('search-collapsed');
		} else {
			$container.removeClass('search-collapsed');
		}
	}

	if(jQuery('body').hasClass('search-form-type-4')){
		var $container = jQuery('.header-layout');
		var $elementWrap = $container.find('.header-element-wrap');
		var $searchWrap = $container.find('.header-search-wrap > .elm-search-form-main');

		if($searchWrap.height() > $elementWrap.height()){
			$container.addClass('search-collapsed');
		} else {
			$container.removeClass('search-collapsed');
		}
	}
}

/* Theme Dependenent Function */
