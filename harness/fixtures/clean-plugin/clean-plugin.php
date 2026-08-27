<?php
/**
 * Plugin Name: Clean Smoketest Fixture
 * Description: Registers a harmless admin page. Used to prove the smoketest passes on healthy plugins.
 * Version: 1.0.0
 */
if ( ! defined( 'WPINC' ) ) { die; }

add_action( 'admin_menu', function () {
	add_menu_page(
		'Clean Fixture',
		'Clean Fixture',
		'manage_options',
		'clean-fixture',
		function () {
			echo '<div class="wrap"><h1>Clean Fixture</h1><p>All good.</p></div>';
		}
	);
} );
