<?php

/*
 * AIT WordPress Theme Framework
 *
 * Copyright (c) 2013, Affinity Information Technology, s.r.o. (http://ait-themes.com)
 */


class AitGetItemsAjax extends AitFrontendAjax
{

	protected $lastDate       = '';
	protected $dates          = array();
	protected $args           = array();
	protected $lang           = 'en';
	protected $posts_per_page = -1;
	protected $offset         = 0;
	protected $taxQuery       = array();
	protected $order          = 'ASC';
	protected $orderBy        = 'date';
	protected $found_posts    = 0;

	/**
	 * @WpAjax
	 */
	public function retrieve()
	{
		switch ($_POST['type']) {
			case 'pagedPosts':
				$this->offset         = $_POST['offset'];
				$this->lang           = $_POST['lang'];
				$this->posts_per_page = $_POST['posts_per_page'];
				$this->orderBy        = $_POST['orderby'];
				$this->order          = $_POST['order'];

				if ($_POST['postType'] == 'ait-event-pro') {
					$this->prepareEventArgs();
					$query = aitGetItems($this->args);
					$html_data = $this->preparePagedEvents($query);
				} else {
					$this->prepareItemArgs();
					$query = aitGetItems($this->args);
					$html_data = $this->preparePagedItems($query);
				}
				$data['request_data'] = $_POST;
				break;
			default:
				break;
		}
		$this->sendJson(array(
			'message' => __("Have posts", 'ait'),
			'raw_data' => $data,
			'html_data' => $html_data,
		));

	}



	/**
	 * @WpAjax
	 */
	public function initFilter()
	{
		$html_data = $this->getRelatedEventsCategories($_POST['itemId']);

		$this->sendJson(array(
			'message' => __("Have posts", 'ait'),
			// 'raw_data' => $data,
			'html_data' => $html_data,
		));

	}


	public function prepareEventArgs()
	{
		$postIn = array();
		$metaQuery = array();

		$taxQuery = array();

		if (isset($_POST['taxonomy'])) {
			$taxQuery = array(
				array(
					'taxonomy' => $_POST['taxonomy']['taxonomy'],
					'field'    => 'id',
					'terms'    => $_POST['taxonomy']['id']
				)
			);
		}

		if (isset($_POST['itemId'])) {
			$metaQuery['related_clause'] = array(
				'key' => 'ait-event-pro-related-item',
				'value' => $_POST['itemId'],
				'compare' => '=',
			);
		}

		// query only actual events
		$postIn = AitEventsPro::getEventsFromDate(date('Y-m-d'));

		if ($this->orderBy == 'eventDate') {
			$orderBy = 'post__in';
		} else {
			$orderBy = $this->orderBy;
		}

		if ($this->order == 'DESC') {
			$postIn = array_reverse($postIn);
		}

		$this->args = array(
			'post_type'      => $_POST['postType'],
			'post_status'    => 'publish',
			'posts_per_page' => $this->posts_per_page,
			'post__in' 		 => $postIn,
			'offset'         => $this->offset,
			'lang'           => $this->lang,
			'tax_query'      => $taxQuery,
			'meta_query'     => $metaQuery,
			'orderby'        => $orderBy,
			'order' 		 => $this->order,
		);
	}




	public function prepareItemArgs()
	{
		$settings    = aitOptions()->getOptionsByType('theme');
		$settings    = $settings['sorting'];
		$topFeatured = $settings['topFeatured'];

		$metaQuery = array();
		$orderBy   = array();

		if ($topFeatured) {
			$metaQuery = array(
				'relation'        => 'AND',
				'featured_clause' => array(
					'key'     => '_ait-item_item-featured',
					'compare' => 'EXISTS'
				)
			);
			$orderBy['featured_clause'] = 'DESC';
		}

		if ( defined('AIT_REVIEWS_ENABLED') && $this->orderBy == 'date' ) {
			$metaQuery['rating_clause'] = array(
				'key'     => 'rating_mean',
				'compare' => 'EXISTS'
			);
			$orderBy['rating_clause'] = $this->order;
		}

		$orderBy[$this->orderBy] = $this->order;

		$this->args = array(
			'post_type'      => 'ait-item',
			'post_status'    => 'publish',
			'posts_per_page' => $this->posts_per_page,
			'offset'         => $this->offset,
			'lang'           => $this->lang,
			'tax_query'      => array(
				array(
					'taxonomy' => $_POST['taxonomy']['taxonomy'],
					'field'    => 'id',
					'terms'    => $_POST['taxonomy']['id']
				)
			),
			'meta_query' => $metaQuery,
			'orderby'    => $orderBy,
		);
	}



	public function preparePagedEvents($query)
	{
		$result = '';

		foreach ($iterator = new WpLatteLoopIterator($query) as $event) {
			// $result .= $this->pagedEventTemplate($event);
			$result .= aitRenderLatteTemplate('/portal/parts/event-container.php', array('post' => $event, 'iterator' => $iterator));
		}
		return $result;
	}



	public function preparePagedItems($query)
	{
		$result = '';

		foreach ($iterator = new WpLatteLoopIterator($query) as $item) {
			$result .= $this->pagedItemTemplate($item);
		}
		return $result;
	}


	public function pagedEventTemplate($post)
	{
		$eventOptions = get_option('ait_events_pro_options', array());
		$noFeatured = $eventOptions['noFeatured'];
		$categories = get_the_terms($post->id, 'events-pro');
		$meta = $post->meta('event-pro-data');

		$nextDates = AitEventsPro::getEventClosestDate($post->id);
		$date_timestamp = strtotime($nextDates['dateFrom']);
		$day = date_i18n('d', $date_timestamp);
		$month = date_i18n('F', $date_timestamp);
		$moreDates = count(AitEventsPro::getEventRecurringDates($post->id)) - 1;

		$imgWidth = 768;
		$imgHeight = 195;
		$imgHeight = ($imgWidth / 4) * 3;
		$result = '
			<div class="event-container">

			<a href="'.$post->permalink.'">
				<div class="item-thumbnail">';
					if ($post->hasImage){
						$result .= '<div class="item-thumbnail-wrap" style="background-image: url(\''.aitResizeImage($post->imageUrl, array('width'=>$imgWidth, 'height'=>$imgHeight, 'crop'=>true)).'\')"></div>';
					} else {
						$result .= '<div class="item-thumbnail-wrap" style="background-image: url(\''.aitResizeImage($noFeatured, array('width'=>$imgWidth, 'height'=>$imgHeight, 'crop'=>true)).'\')"></div>';
					}
				$result .= '</div>

				<div class="entry-date">
					<div class="day">'.$day.'</div>
					<div class="month">'.$month.'</div>';
					if ($moreDates > 0) {
						$result .= '<div class="more">'.$moreDates.'</div>';
					}
				$result .= '</div>

			</a>
			<div class="item-text">
				<div class="item-title"><a href="'.$post->permalink.'"><h3>'.$post->title.'</h3></a></div>
				<div class="item-excerpt"><p class="txtrows-3">'. strip_tags($post->excerpt(200)).'</p></div>

				<div class="item-taxonomy">

					<div class="item-location">';
						foreach ($post->categories('ait-locations') as $loc) {
							$result .= '<a href="'.$loc->url().'" class="location">'.$loc->title.'</a>';
						}
					$result .= '</div>

					<div class="item-categories">';
					aitRenderLatteTemplate('/portal/parts/event-taxonomy.php', array('itemID' => $post->id, 'taxonomy' => 'ait-events-pro', 'onlyParent' => true, 'count' => 3));
					$result .= '</div>

				</div>

			</div>
			<div class="item-more"><a href="'.$post->permalink.'">'.__( 'More info', 'ait').'</a></div>

			</div>';
		return $result;
	}



	public function pagedItemTemplate($post)
	{
		$itemSettings = aitOptions()->getOptionsByType('theme');
		$itemSettings = $itemSettings['item'];
		$noFeatured = $itemSettings['noFeatured'];
		$categories = get_the_terms($post->id, 'ait-items');
		$meta = $post->meta('item-data');

		$dbFeatured = get_post_meta($post->id, '_ait-item_item-featured', true);
		$isFeatured = $dbFeatured != "" ? (bool)$dbFeatured : false;
		$featuredClass = $isFeatured ? ' item-featured ' : '';
		$reviewsClass = defined("AIT_REVIEWS_ENABLED") ? ' reviews-enabled ' : '';
		$imgWidth = 768;
		$imgHeight = 195;
		$imgHeight = ($imgWidth / 4) * 3;
		// $result = '';
		$result = '
			<div class="item-container'.$featuredClass.$reviewsClass .'">

			<a href="'.$post->permalink.'">
				<div class="item-thumbnail">';
					if ($post->hasImage){
						$result .= '<div class="item-thumbnail-wrap" style="background-image: url(\''.aitResizeImage($post->imageUrl, array('width'=>$imgWidth, 'height'=>$imgHeight, 'crop'=>true)).'\')"></div>';
					} else {
						$result .= '<div class="item-thumbnail-wrap" style="background-image: url(\''.aitResizeImage($noFeatured, array('width'=>$imgWidth, 'height'=>$imgHeight, 'crop'=>true)).'\')"></div>';
					}
				$result .= '</div>



			</a>
			<div class="item-text">';
				if (defined('AIT_REVIEWS_ENABLED')) {
				aitRenderLatteTemplate('/portal/parts/carousel-reviews-stars.php', array('item' => $post, 'showCount' => false));
				}
				$result .= '<div class="item-title"><a href="'.$post->permalink.'"><h3>'.$post->title.'</h3></a></div>';


				if (count($categories) > 0){
				$result .= '
					<div class="item-categories">';
					aitRenderLatteTemplate('/portal/parts/item-taxonomy.php', array('itemID' => $post->id, 'taxonomy' => 'ait-items'));
					$result .= '</div>';
				}

				$result .= '<div class="item-excerpt">
					<p class="txtrows-3">';

					if ($post->hasContent){
						$result .= substr(trim(strip_tags($post->content)), 0, 180);
					} else {
						$result .= substr(trim(strip_tags($post->excerpt)), 0, 180);
					}
					$result .= '
					</p>
				</div>

				<div class="item-location"><p>'.$meta->map['address'].'</p></div>

			</div>
			<div class="item-more"><a href="'.$post->permalink.'">'.__( 'More info', 'ait').'</a></div>

			</div>';
		return $result;
	}




	public function getRelatedEventsCategories($itemId)
	{
		$parents = array();
		$query = AitEventsPro::getEventsByItem($itemId);
		foreach (new WpLatteLoopIterator($query) as $event) {
			$terms = get_the_terms($event->id, 'ait-events-pro');
			if ($terms) {
				foreach ($terms as $category) {
					// start from the current term
				    $parent  = get_term_by( 'id', $category->term_id, 'ait-events-pro');
				    // climb up the hierarchy until we reach a term with parent = '0'
				    while ($parent->parent != '0'){
				        $term_id = $parent->parent;

				        $parent  = get_term_by( 'id', $term_id, 'ait-events-pro');
				    }
				    $parents[$parent->term_id] = new WpLatteTaxonomyTermEntity($parent, 'ait-events-pro');
					// $categories = $wp->categories(array('taxonomy' => 'ait-events-pro', 'hide_empty' => 0, 'parent' => $parentCategory))}
				}
			}
		}
		return aitRenderLatteTemplate('/portal/parts/timeline-taxonomy-filter.php', array('categories' => $parents, 'taxonomy' => 'ait-events-pro'));

	}


}
