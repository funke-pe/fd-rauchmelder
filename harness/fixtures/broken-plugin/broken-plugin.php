<?php
/**
 * Plugin Name: Broken Smoketest Fixture
 * Description: Its admin page triggers a PHP fatal. Used to prove the smoketest FAILS on a broken plugin.
 * Version: 1.0.0
 */
if ( ! defined( 'WPINC' ) ) { die; }

add_action( 'admin_menu', function () {
	add_menu_page(
		'Broken Fixture',
		'Broken Fixture',
		'manage_options',
		'broken-fixture',
		function () {
			// Deliberate fatal: calling an undefined function.
			fd_smoketest_undefined_function_boom();
		}
	);
} );
