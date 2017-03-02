<!doctype html>
<!--[if IE 8]>
<html {languageAttributes}  class="lang-{$currentLang->locale} {$options->layout->custom->pageHtmlClass} ie ie8">
<![endif]-->
<!--[if !(IE 7) | !(IE 8)]><!-->
<html {languageAttributes} class="lang-{$currentLang->locale} {$options->layout->custom->pageHtmlClass}">
<!--<![endif]-->
<head>
	<meta charset="{$wp->charset}">
	<meta name="viewport" content="width=device-width, target-densityDpi=device-dpi">
	<link rel="profile" href="http://gmpg.org/xfn/11">
	<link rel="pingback" href="{$wp->pingbackUrl}">

	{if $options->theme->general->favicon != ""}
		<link href="{$options->theme->general->favicon}" rel="icon" type="image/x-icon" />
	{/if}

	{includePart parts/seo}

	{googleAnalytics $options->theme->google->analyticsTrackingId}

	{wpHead}

	{!$options->theme->header->customJsCode}
</head>

{var $searchFormClass = ""}
{if $elements->unsortable[search-form]->display}
	{var $searchFormClass = $elements->unsortable[search-form]->option('type') != "" ? "search-form-type-".$elements->unsortable[search-form]->option('type') : "search-form-type-1"}
{/if}

<body n:class="$wp->bodyHtmlClass(false), defined('AIT_REVIEWS_ENABLED') ? reviews-enabled, $searchFormClass, $options->layout->general->showBreadcrumbs ? breadcrumbs-enabled">
	{* usefull for inline scripts like facebook social plugins scripts, etc... *}
	{doAction ait-html-body-begin}

	{if $wp->isPage}
	<div id="page" class="page-container header-one">
	{else}
	<div id="page" class="hfeed page-container header-one">
	{/if}


		<header id="masthead" class="site-header" role="banner">
			<div class="menu-con">
				<div id="logo" class="pull-right">
					<a href="{$homeUrl}" title="{$wp->name}" rel="home"><img src="{$options->theme->header->logo}" alt="logo"></a>
				</div>
				<div class="slogan pull-right"></div>
				<div class="menu-items pull-left">
					<button class="menu-button menu-join">عضو شوید</button>
					<button class="menu-button menu-promote">دیده شوید</button>
					<button class="menu-button menu-verify">مطمئن شوید</button>
					<button class="menu-button menu-search">بیابید</button>
				</div>
				<div class="clearboth"></div>
			</div>
			<a class="download-app">
				
			</a>
		</header>

		<div class="sticky-menu menu-container" >
			<div class="menu-con">
				<div class="site-logo pull-right">
					<a href="{$homeUrl}" title="{$wp->name}" rel="home"><img src="{$options->theme->header->logo}" alt="logo"></a>
				</div>
				<div class="slogan pull-right"></div>
				<nav class="menu-items pull-left">
					<button class="menu-button menu-join">عضو شوید</button>
					<button class="menu-button menu-promote">دیده شوید</button>
					<button class="menu-button menu-verify">مطمئن شوید</button>
					<button class="menu-button menu-search">بیابید</button>
				</nav>
			</div>
		</div>
