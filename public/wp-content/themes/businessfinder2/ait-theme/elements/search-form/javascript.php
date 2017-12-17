<script id="{$htmlId}-script">
jQuery(document).ready(function(){
	jQuery('#the-modal').easyModal();

	if (typeof globalMaps == 'undefined') {
		var mapInterval = setInterval(function(){ 
			if (typeof globalMaps != 'undefined' && typeof globalMaps.headerMap != 'undefined' && typeof globalMaps.headerMap.map != 'undefined') {
				clearInterval(mapInterval);
				showCurrentLocation(doSearch);
				jQuery.ajax({
			        url: 'https://buyoriginal.herokuapp.com/services/v1/dev/cities/',
			        type: 'GET',
			        beforeSend: function (request)
			        {
			        	request.setRequestHeader("Content-Type", "application/json");
			        	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
			        },
			        success: function(result) {
			        	result.forEach(function(item, index, array){
			        		jQuery('#city-select').append('<option data-lat="'+item.centerLat+'" data-lon="'+item.centerLon+'" value="' + item.areaCode + '">' + item.cityNameFa + '</option>')
			        	});
			        	jQuery('#city-select').prop("disabled", false);
			        	if (typeof globalMaps.headerMap.userLoc != 'object') {
				        	jQuery('#city-select').val('021');
				        	jQuery('#city-select').select2("val", "021");
				        	jQuery("#city-select").trigger('change');
				        	doSearch();
			        	}
			        	
			        },
			        error: function(result){
			        	console.log(result);
			        	debugger;
			        }
			    });
			}
		}, 1000);
	}
	jQuery('.current-loc-main-button').click(function(){
		showCurrentLocation();
	});

	jQuery("#city-select").on('change', function() {
		removeSearchedMarkers();
		var center = {
			lat: parseFloat(jQuery('option:selected', this).attr('data-lat')),
			lng: parseFloat(jQuery('option:selected', this).attr('data-lon'))
		}
		globalMaps.headerMap.map.setCenter(center);
		globalMaps.headerMap.map.setZoom(12);
		var userLocImageStatic = {
		    url: '/wp-content/themes/businessfinder2/design/img/user-location.png',
		    // This marker is 20 pixels wide by 32 pixels high.
		    size: new google.maps.Size(40, 73),
		    // The origin for this image is (0, 0).
		    origin: new google.maps.Point(0, 0),
		    anchor: new google.maps.Point(20, 73)
		  };
		var userLocImageMoving = {
		    url: '/wp-content/themes/businessfinder2/design/img/user-location-moving.png',
		    // This marker is 20 pixels wide by 32 pixels high.
		    size: new google.maps.Size(40, 73),
		    // The origin for this image is (0, 0).
		    origin: new google.maps.Point(0, 0),
		    anchor: new google.maps.Point(20, 73)
		  };
		if (globalMaps.headerMap.userPositionMarker) {
			globalMaps.headerMap.userPositionMarker.setPosition(center);
		} else {
			var userPositionMarker = new google.maps.Marker({
				icon: userLocImageStatic,
				position: center,
				map: globalMaps.headerMap.map,
				title: 'Drag me!',
				draggable: true
	        });
        	globalMaps.headerMap.userPositionMarker = userPositionMarker;
			
		}
        jQuery('#user-latitude').html(center.lat);
    	jQuery('#user-longitude').html(center.lng);
        globalMaps.headerMap.userPositionMarker.addListener('position_changed', function() {
        	var pos = globalMaps.headerMap.userPositionMarker.getPosition();
        	jQuery('#user-latitude').html(pos.lat());
        	jQuery('#user-longitude').html(pos.lng());
        });
        globalMaps.headerMap.userPositionMarker.addListener('dragstart', function() {
        	globalMaps.headerMap.userPositionMarker.setIcon(userLocImageMoving);
        });
        globalMaps.headerMap.userPositionMarker.addListener('dragend', function() {
        	globalMaps.headerMap.userPositionMarker.setIcon(userLocImageStatic);
        	doSearch();
        });

		var aCode = this.value;
    	jQuery('#category-select').empty();
    	jQuery('#category-select').append('<option value="">&nbsp;</option>');
    	jQuery('#brand-select').empty();
    	jQuery('#brand-select').append('<option value="">&nbsp;</option>');
    	jQuery("#brand-select").val('').trigger('change');
    	jQuery("#category-select").val('').trigger('change');
		jQuery.ajax({
	        url: 'https://buyoriginal.herokuapp.com/services/v1/dev/categories/areacode/'+aCode,
	        type: 'GET',
	        beforeSend: function (request)
	        {
	        	request.setRequestHeader("Content-Type", "application/json");
	        	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
	        },
	        success: function(result) {
	        	result.forEach(function(item, index, array){
	        		jQuery('#category-select').append('<option value="' + item.bCategoryId + '">' + item.bCategory + '</option>')
	        	});
	        	jQuery('#category-select').prop("disabled", false);
	        	
	        },
	        error: function(result){
	        	console.log(result);
	        	debugger;
	        }
	    });
	});
	jQuery("#category-select").on('change', function() {
		var catId = this.value;
		if (catId != '') {
			var aCode = jQuery('#city-select').val();
			var brandUrl = '';
			if (aCode != '') {
				brandUrl = 'https://buyoriginal.herokuapp.com/services/v1/dev/brands/areacode/'+aCode+'/category/'+catId;
			} else {
				brandUrl = 'https://buyoriginal.herokuapp.com/services/v1/dev/brands/categoryId/'+catId;
			}
	    	jQuery('#brand-select').empty();
	    	jQuery('#brand-select').append('<option value="">&nbsp;</option>');
			jQuery("#brand-select").val('').trigger('change');
			jQuery.ajax({
		        url: brandUrl,
		        type: 'GET',
		        beforeSend: function (request)
		        {
		        	request.setRequestHeader("Content-Type", "application/json");
		        	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
		        },
		        success: function(result) {
		        	result.forEach(function(item, index, array){
		        		jQuery('#brand-select').append('<option value="' + item.bId + '">' + item.bName + '</option>')
		        	});
		        	jQuery('#brand-select').prop("disabled", false);
		        },
		        error: function(result){
		        	console.log(result);
		        	debugger;
		        }
		    });
		}
	});


	{if $options->theme->general->progressivePageLoading}
		if(!isResponsive(1024)){
			jQuery("#{!$htmlId}-main").waypoint(function(){
				jQuery("#{!$htmlId}-main").addClass('load-finished');
			}, { triggerOnce: true, offset: "95%" });
		} else {
			jQuery("#{!$htmlId}-main").addClass('load-finished');
		}
	{else}
		jQuery("#{!$htmlId}-main").addClass('load-finished');
	{/if}


	var select2Settings = {
		dropdownAutoWidth : true
	};


	jQuery('#{!$htmlId}').find('select').select2(select2Settings).on("select2-loaded", function() {
		// fired to the original element when the dropdown closes
		jQuery('#{!$htmlId}').find('.select2-container').removeAttr('style');
	});

	jQuery('#{!$htmlId}').find('select').select2(select2Settings).on("select2-open", function() {
		var selectPosition = jQuery('#{!$htmlId}').find('.select2-dropdown-open').parent().attr('data-position');
		jQuery('.select2-drop').addClass('select-position-'+selectPosition);
	});

	if(isMobile()){
		jQuery('#{!$htmlId} .category-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				jQuery('#{!$htmlId}').find('.category-clear').addClass('clear-visible');
			}
		});
		jQuery('#{!$htmlId} .location-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				jQuery('#{!$htmlId}').find('.location-clear').addClass('clear-visible');
			}
		});

		jQuery('#{!$htmlId} .category-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				// add class
				jQuery('#{!$htmlId} .category-search-wrap').addClass('option-selected');
			}
		});
		jQuery('#{!$htmlId} .location-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				jQuery('#{!$htmlId} .location-search-wrap').addClass('option-selected');
			}
		});
	} else {
		jQuery('#{!$htmlId} .category-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				// add class
				jQuery('#{!$htmlId} .category-search-wrap').addClass('option-selected');
			}
		});
		jQuery('#{!$htmlId} .location-search-wrap').find('select').select2(select2Settings).on("select2-selecting", function(val, choice) {
			if(val != ""){
				jQuery('#{!$htmlId} .location-search-wrap').addClass('option-selected');
			}
		});

		jQuery('#{!$htmlId}').find('.category-search-wrap').hover(function(){
			if(jQuery(this).find('select').select2("val") != ""){
				jQuery(this).find('.category-clear').addClass('clear-visible');
			}
		},function(){
			if(jQuery(this).find('select').select2("val") != ""){
				jQuery(this).find('.category-clear').removeClass('clear-visible');
			}
		});

		jQuery('#{!$htmlId}').find('.location-search-wrap').hover(function(){
			if(jQuery(this).find('select').select2("val") != ""){
				jQuery(this).find('.location-clear').addClass('clear-visible');
			}
		},function(){
			if(jQuery(this).find('select').select2("val") != ""){
				jQuery(this).find('.location-clear').removeClass('clear-visible');
			}
		});
	}

	jQuery('#{!$htmlId}').find('.select2-chosen').each(function(){
		jQuery(this).html(jQuery(this).html().replace(new RegExp("&nbsp;", "g"), ''));
	});


	if(isMobile()){
		jQuery('#{!$htmlId}').find('.radius').on('click', function(){
			jQuery(this).find('.radius-clear').addClass('clear-visible');
		});
	} else {
		jQuery('#{!$htmlId}').find('.radius').hover(function(){
			jQuery(this).find('.radius-clear').addClass('clear-visible');
		},function(){
			jQuery(this).find('.radius-clear').removeClass('clear-visible');
		});
	}

	jQuery('#{!$htmlId}').find('.category-clear').click(function(){
		jQuery('#{!$htmlId}').find('.category-search-wrap select').select2("val", "");
		jQuery(this).removeClass('clear-visible');
		// remove class selected
		jQuery('#{!$htmlId} .category-search-wrap').removeClass('option-selected');
	});
	jQuery('#{!$htmlId}').find('.location-clear').click(function(){
		jQuery('#{!$htmlId}').find('.location-search-wrap select').select2("val", "");
		jQuery(this).removeClass('clear-visible');
		// remove class selected
		jQuery('#{!$htmlId} .location-search-wrap').removeClass('option-selected');
	});


	/* RADIUS SCRIPT */


	{if $type == 4}
		var $radiusContainer = jQuery('#{!$htmlId} .radius');
		initRadius($radiusContainer);


	{else}
	var $headerMap = jQuery("#{!$elements->unsortable[header-map]->getHtmlId()}-container");

	var $radiusContainer = jQuery('#{!$htmlId} .radius');
	var $radiusToggle = $radiusContainer.find('.radius-toggle');
	var $radiusDisplay = $radiusContainer.find('.radius-display');
	var $radiusPopup = $radiusContainer.find('.radius-popup-container');

	$radiusToggle.click(function(){
		jQuery(this).removeClass('radius-input-visible').addClass('radius-input-hidden');
		$radiusContainer.find('input').each(function(){
			jQuery(this).removeAttr('disabled');
		});
		$radiusDisplay.removeClass('radius-input-hidden').addClass('radius-input-visible');
		$radiusDisplay.trigger('click');

		$radiusDisplay.find('.radius-value').html($radiusPopup.find('input').val());
		$radiusPopup.find('.radius-value').html($radiusPopup.find('input').val());
	});

	$radiusDisplay.click(function(){
		$radiusPopup.removeClass('radius-input-hidden').addClass('radius-input-visible');

		if($headerMap.length != 0){
			$headerMap.gmap3({
				getgeoloc: {
					callback: function(latLng){
						if(latLng){
							jQuery("#latitude-search").attr('value', latLng.lat());
							jQuery("#longitude-search").attr('value', latLng.lng());
							jQuery(".elm-header-map ").removeClass('deactivated');
						}
					}
				}
			});
		} else {
			navigator.geolocation.getCurrentPosition(function(position){
				jQuery("#latitude-search").attr('value', position.coords.latitude);
				jQuery("#longitude-search").attr('value', position.coords.longitude);
				jQuery(".elm-header-map ").removeClass('deactivated');
			}, function(){
				// error callback
			});
		}
	});
	$radiusDisplay.find('.radius-clear').click(function(e){
		e.stopPropagation();
		$radiusDisplay.removeClass('radius-input-visible').addClass('radius-input-hidden');
		$radiusContainer.find('input').each(function(){
			jQuery(this).attr('disabled', true);
		});
		$radiusPopup.find('.radius-popup-close').trigger('click');
		$radiusToggle.removeClass('radius-input-hidden').addClass('radius-input-visible');
		$radiusContainer.removeClass('radius-set');
	});
	$radiusPopup.find('.radius-popup-close').click(function(e){
		e.stopPropagation();
		$radiusPopup.removeClass('radius-input-visible').addClass('radius-input-hidden');
	});
	$radiusPopup.find('input').change(function(){
		$radiusDisplay.find('.radius-value').html(jQuery(this).val());
		$radiusPopup.find('.radius-value').html(jQuery(this).val());
	});

	{if $selectedRad}
	$radiusToggle.trigger('click');
	{/if}
	{/if}

	/* RADIUS SCRIPT */

	{if $type == 2}
	/* KEYWORD INPUT HACK */
	var $keywordContaier = jQuery('#{!$htmlId} #searchinput-text');
	var $keywordWidthHack = jQuery('#{!$htmlId} .search-input-width-hack');

	if($keywordContaier.val() != ""){
		$keywordWidthHack.html($keywordContaier.val());
	} else {
		$keywordWidthHack.html($keywordWidthHack.attr('data-defaulttext'));
	}
	$keywordContaier.width($keywordWidthHack.width());

	$keywordContaier.on('keyup', function(){
		if(jQuery(this).val() != ""){
			$keywordWidthHack.html(jQuery(this).val());
		} else {
			$keywordWidthHack.html($keywordWidthHack.attr('data-defaulttext'));
		}

		if($keywordWidthHack.width() <= 150){
			if(jQuery(this).val() != ""){
				$keywordContaier.width($keywordWidthHack.outerWidth(true));
			} else {
				$keywordContaier.width($keywordWidthHack.width());
			}
		}
	});
	/* KEYWORD INPUT HACK */
	{/if}

	{if $type == 3}
	jQuery('#{!$htmlId} .category-search-wrap .category-icon').on('click', function(){
		jQuery(this).parent().find('select').select2('open');
	});
	jQuery('#{!$htmlId} .location-search-wrap .location-icon').on('click', function(){
		jQuery(this).parent().find('select').select2('open');
	});
	{/if}

	jQuery('.searchsubmit2').click(function(){
		doSearch();
	});
});



function updateRadiusText(context) {
	var value = context.value;
	jQuery(context).closest('.radius').find('.radius-value').text(value);
}

function toggleRadius(context) {
	var $container = jQuery(context).parent('.radius');
	if ($container.hasClass('radius-set')) {
		// disable radius and geolocation
		$container.find('input').each(function(){
			jQuery(this).attr('disabled', true);
		});
		$container.removeClass('radius-set');
	} else {
		// enable radius and geolocation
		$container.find('input').each(function(){
			jQuery(this).attr('disabled', false);
		});
		$container.addClass('radius-set');
	}
}

function initRadius($container) {
	if ($container.hasClass('radius-set')) {
		$container.find('input').each(function(){
			jQuery(this).attr('disabled', false);
		});
	} else {
		$container.find('input').each(function(){
			jQuery(this).attr('disabled', true);
		});
	}
}

function showCurrentLocation(callback) {
	var gMapApiKey = jQuery( "script[src*='maps.google.com/maps/api']" ).attr('src').split('&')[1].substr(4);
	if (gMapApiKey != '') {
		jQuery.post( "https://www.googleapis.com/geolocation/v1/geolocate?key="+gMapApiKey, function(result) {
			var userLoc = {
				lat: result.location.lat,
				lng: result.location.lng
			}
			globalMaps.headerMap.userLoc = userLoc;
			globalMaps.headerMap.map.setCenter(userLoc);
			globalMaps.headerMap.map.setZoom(12);
			var userLocImageStatic = {
			    url: '/wp-content/themes/businessfinder2/design/img/user-location.png',
			    // This marker is 20 pixels wide by 32 pixels high.
			    size: new google.maps.Size(40, 73),
			    // The origin for this image is (0, 0).
			    origin: new google.maps.Point(0, 0),
			    anchor: new google.maps.Point(20, 73)
			  };
			var userLocImageMoving = {
			    url: '/wp-content/themes/businessfinder2/design/img/user-location-moving.png',
			    // This marker is 20 pixels wide by 32 pixels high.
			    size: new google.maps.Size(40, 73),
			    // The origin for this image is (0, 0).
			    origin: new google.maps.Point(0, 0),
			    anchor: new google.maps.Point(20, 73)
			  };
			if (globalMaps.headerMap.userPositionMarker) {
				globalMaps.headerMap.userPositionMarker.setPosition(userLoc);
			} else {
				var userPositionMarker = new google.maps.Marker({
					icon: userLocImageStatic,
					position: userLoc,
					map: globalMaps.headerMap.map,
					title: 'Drag me!',
					draggable: true
		        });
	        	globalMaps.headerMap.userPositionMarker = userPositionMarker;
			}
			jQuery('#city-select').val('');
	    	jQuery('#city-select').select2("val", "");
			jQuery('#user-latitude').html(userLoc.lat);
	    	jQuery('#user-longitude').html(userLoc.lng);
	        globalMaps.headerMap.userPositionMarker.addListener('position_changed', function() {
	        	var pos = globalMaps.headerMap.userPositionMarker.getPosition();
	        	jQuery('#user-latitude').html(pos.lat());
	        	jQuery('#user-longitude').html(pos.lng());
	        });
	        globalMaps.headerMap.userPositionMarker.addListener('dragstart', function() {
	        	globalMaps.headerMap.userPositionMarker.setIcon(userLocImageMoving);
	        });
	        globalMaps.headerMap.userPositionMarker.addListener('dragend', function() {
	        	globalMaps.headerMap.userPositionMarker.setIcon(userLocImageStatic);
	        	doSearch();
	        });
	        jQuery('#category-select').empty();
	    	jQuery('#category-select').append('<option value="">&nbsp;</option>');
	    	jQuery('#brand-select').empty();
	    	jQuery('#brand-select').append('<option value="">&nbsp;</option>');
	    	jQuery("#brand-select").val('').trigger('change');
	    	jQuery("#category-select").val('').trigger('change');
			jQuery.ajax({
		        url: 'https://buyoriginal.herokuapp.com/services/v1/dev/categories/categorylist/',
		        type: 'GET',
		        beforeSend: function (request)
		        {
		        	request.setRequestHeader("Content-Type", "application/json");
		        	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
		        },
		        success: function(result) {
		        	result.forEach(function(item, index, array){
		        		jQuery('#category-select').append('<option value="' + item.cId + '">' + item.cName + '</option>')
		        		if (index == array.length - 1) {
		        			callback();
		        		}
		        	});
		        	jQuery('#category-select').prop("disabled", false);
		        	
		        },
		        error: function(result){
		        	console.log(result);
		        	debugger;
		        }
		    });
		})
		.fail(function(err) {
			console.log(err);
		});
	}
}


function doSearch() {
	// Remove previous searched markers
	removeSearchedMarkers();

	var distance = '2';
	var userLat = jQuery('#user-latitude').html();
	var userLng = jQuery('#user-longitude').html();
	var city = (jQuery('#city-select').val() != '' ? jQuery('#city-select').val() : 'unknown');
	var category = jQuery('#category-select').val();
	if (category == '') {
		category = 'all';
	}
	var brand = jQuery('#brand-select').val();
	if (brand == '') {
		brand = 'all';
	} else {
		distance = '15';
	}
	var onlyVerified = jQuery('#verification-checkbox').is(':checked');
	var onlyDiscount = jQuery('#sales-checkbox').is(':checked');

	jQuery.ajax({
	    url: 'http://buyoriginal.herokuapp.com/services/v1/dev/stores/search/' + city + '/' + category + '/' + brand + '/' + onlyDiscount + '/' + onlyVerified + '/' + distance + '/' + userLat + '/' + userLng,
	    type: 'GET',
	    beforeSend: function (request)
	    {
	    	request.setRequestHeader("Content-Type", "application/json");
	    	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
	    },
	    success: function(result) {
	    	if (result.length != 0) {
				
		    	//var infowindow = new google.maps.InfoWindow;
		    	var itemHtml = '';
		    	var imageName = '';
		    	var processedItems = 0;
		    	var bounds = new google.maps.LatLngBounds();
		    	if (typeof globalMaps.headerMap.userPositionMarker != 'undefined') {
		    		bounds.extend(globalMaps.headerMap.userPositionMarker.getPosition());
		    		globalMaps.headerMap.map.fitBounds(bounds);
		    	}
		        result.forEach(function(item, index, array){
		        	var myLatLng = {};
		        	myLatLng.lat = parseFloat(item.sLat);
		        	myLatLng.lng = parseFloat(item.sLong);
			        imageName = item.bName.toLowerCase().replace(/ /g, '');

			        var pictureLabel = document.createElement("img");
					pictureLabel.src = '/wp-content/themes/businessfinder2/design/img/logos/'+imageName+'.png';
					var image = {
					    url: '/wp-content/themes/businessfinder2/design/img/base-marker.png',
					    // This marker is 20 pixels wide by 32 pixels high.
					    size: new google.maps.Size(40, 52),
					    // The origin for this image is (0, 0).
					    origin: new google.maps.Point(0, 0),
					    // The anchor for this image is the base of the flagpole at (0, 32).
					    anchor: new google.maps.Point(0, 52)
					  };
					  var labelStyle = {
					  	width: '33px', 
					  	height: '33px',
					  	borderRadius: '50%',
					  	zIndex: 200
					  };
					var marker = new MarkerWithLabel({
						position: myLatLng,
						icon: image,
						map: globalMaps.headerMap.map,
						draggable: false,
						raiseOnDrag: false,
						labelContent: pictureLabel,
						labelAnchor: new google.maps.Point(-3, 49),
						labelClass: "marker-labels",
						labelStyle: labelStyle
					});

			        bounds.extend(marker.getPosition());
			        globalMaps.headerMap.map.fitBounds(bounds);
			        marker.addListener('click', function() {
			        	jQuery('.selected-brand').removeClass('selected-brand');
			        	var obj = {
			        		offset: -110,
			        	};
						jQuery('html').scrollTo(jQuery('.stores-list'), 800, obj);
			        	jQuery('.stores-list').scrollTo(jQuery('#elem-'+item._id), 800);
			        	jQuery('#elem-'+item._id).addClass('selected-brand');
			        });
			        globalMaps.headerMap.ourMarkers.push(marker);
			        //globalMaps.headerMap.ourInfoWindows.push(infowindow);
			  //       jQuery.ajax({
					//             url: 'https://buyoriginal.herokuapp.com/services/v1/dev/brands/verification/'+item.bId,
					//             type: 'GET',
					//             beforeSend: function (request)
					//             {
					//             	request.setRequestHeader("Content-Type", "application/json");
					//             	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
					//             },
					// success: function(result){
					// console.log(result)

					// }
					// });
					itemHtml = '<li class="store-elem" id="elem-'+item._id+'">' +
					(item.sVerified == 'YES' ? '<a class="verified"></a>' : '') + (item.hasOwnProperty('dPrecentage') ? '<a class="discounted">'+item.dPrecentage+'%</a>' : '') +
									'<div class="store-item">\
										<div class="store-image">\
											<img src="/wp-content/themes/businessfinder2/design/img/logos/'+imageName+'.png" />\
										</div>\
										<div class="store-info">'+
										(item.hasOwnProperty('verifiationHints') && item.verifiationHints == 'true' ? '<a class="hints" data-brandid='+item.bId+'>نکات اصل و تقلبی</a>' : '')
											+'<h4>'+item.sName+'</h4>\
											<p>\
												<span>آدرس: </span><span>'+item.sAddress+'</span>\
											</p>\
											<p>\
												<span>تلفن: </span><span>'+item.sTel1+(item.hasOwnProperty('sTel2') && item.sTel2 != '' ? ' - '+item.sTel2 : '')+'</span>' +
												(item.hasOwnProperty('sHours') && item.sHours != '' ? '<span>&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; ساعت کار: </span><span>'+item.sHours+'</span>' : '') +
											'</p>\
											<p class="store-icons">\
										</p></div>\
									</div>\
									<div class="clearboth"></div>\
								</li>';
			        jQuery('.elements-area .stores-list').append(itemHtml);
			        processedItems++;

		        });
		        jQuery('.hints').click(function(){
					var brandId = this.dataset.brandid;
		        	jQuery('#the-modal').trigger('openModal');

		        	jQuery('.hints-list ul').html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span>');
					jQuery.ajax({
				        url: 'https://buyoriginal.herokuapp.com/services/v1/dev/brands/verification/' + brandId,
				        type: 'GET',
				        beforeSend: function (request)
				        {
				        	request.setRequestHeader("Content-Type", "application/json");
				        	request.setRequestHeader("token", "emFuYmlsZGFyYW5naGVybWV6DQo=");
				        },
				        success: function(result) {
				        	jQuery('.hints-list ul').html('');
				        	result.forEach(function(item, index, array){
				        		jQuery('.hints-list ul').append('<li>\
								<div class="hint-text">'+item.longDesc+'</div>\
								<div class="hint-img">\
									<img src="https://buyoriginal.herokuapp.com/images/verifications/'+item.largeImage+'" />\
								</div>\
							</li><hr />');
				        	});

				        	
				        },
				        error: function(result){
				        	console.log(result);
				        	debugger;
				        }
				    });
				});
	    	} else {
	    		jQuery('.elements-area .stores-list').html('<h2 class="empty-results">موردی یافت نشد!</h2>');
	    	}
	    },
	    error: function(result){
	    	console.log(result);
	    	debugger;
	    }
	});
}
function removeSearchedMarkers() {
	if (typeof globalMaps.headerMap.ourMarkers !== 'undefined') {
		for (var i = 0; i < globalMaps.headerMap.ourMarkers.length; i++ ) {
			globalMaps.headerMap.ourMarkers[i].setMap(null);
		}
		globalMaps.headerMap.ourMarkers.length = 0;
	}
	globalMaps.headerMap.ourMarkers = [];
	jQuery('.elements-area .stores-list').empty();
}


</script>
