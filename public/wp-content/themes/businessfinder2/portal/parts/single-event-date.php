{*
required part parameters:
	$eventId
*}

{if !empty($meta->dates)}

	{var $firstDate = $meta->dates}
	{var $firstDate = $firstDate[0]}

	{var $nextDates = AitEventsPro::getEventClosestDate($eventId)}

	{var $dateFormat = get_option('date_format');}
	{var $timeFormat = get_option('time_format');}


	{if !empty($nextDates)}

		{var $dateFrom_timestamp = strtotime($nextDates['dateFrom'])}
		{var $dateFrom_formatted = date($dateFormat, $dateFrom_timestamp)}
		{var $timeFrom_formatted = date($timeFormat, $dateFrom_timestamp)}

		{if $nextDates['dateTo']}

			{var $dateTo_timestamp = strtotime($nextDates['dateTo'])}
			{var $dateTo_formatted = date($dateFormat, $dateTo_timestamp)}
			{var $timeTo_formatted = date($timeFormat, $dateTo_timestamp)}

		{/if}
	{else}
		{var $dateFrom_timestamp = strtotime($firstDate['dateFrom'])}
		{var $dateFrom_formatted = date_i18n($dateFormat, $dateFrom_timestamp)}
		{var $timeFrom_formatted = date_i18n($timeFormat, $dateFrom_timestamp)}
		{if $firstDate['dateTo']}

			{var $dateTo_timestamp = strtotime($firstDate['dateTo'])}
			{var $dateTo_formatted = date_i18n($dateFormat, $dateTo_timestamp)}
			{var $timeTo_formatted = date_i18n($timeFormat, $dateTo_timestamp)}

		{/if}

	{/if}



	{if isset($place) and $place == 'header'}

		{var $day = date('d', $dateFrom_timestamp)}
		{var $month = date('M', $dateFrom_timestamp)}
		{var $year = date('Y', $dateFrom_timestamp)}

		<div class="entry-date updated">
			<div class="date">
				{if $firstDate['dateFrom']}
					<span class="link-day">{$day}</span>
					<span class="link-month">{$month}</span>
					<span class="link-month">{$year}</span>
				{/if}
			</div>
		</div>

	{else}

		<div class="date-container data-container">
			<div class="content">
				<div class="date data">
					<div class="date-text data-content">
						{if isset($dateFrom_formatted)}
							<div class="event-table-row">
								<div class="event-cell">
									{if isset($dateTo_formatted)}<strong><i class="fa fa-calendar"></i> {__ 'Start:'}</strong>{/if}
									<span class="date">{$dateFrom_formatted}</span>
								</div>
								<div class="event-cell odd"><strong>{$timeFrom_formatted}</strong></div>
							</div>
						{/if}
						{if isset($dateTo_formatted)}
							<div class="event-table-row">
								<div class="event-cell">
									<strong><i class="fa fa-calendar"></i> {__ 'End:'}</strong>
									<span class="date">{$dateTo_formatted} </span>
								</div>
								<div class="event-cell odd"><strong>{$timeTo_formatted}</strong></div>
							</div>
						{/if}
					</div>
					<div class="date-export data-content">
						{includePart "parts/ics-export-button"}
					</div>
				</div>
			</div>
		</div>

	{/if}

{/if}
