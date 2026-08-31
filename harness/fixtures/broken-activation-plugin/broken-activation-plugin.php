<?php
/**
 * Plugin Name: Broken Activation Fixture
 * Description: Has a PHP parse error (an unclosed brace) so it fails at
 *              activation/boot time, not at admin-page render time. Proves the
 *              harness catches parse/activation fatals, not just runtime ones.
 */

// Unclosed brace on purpose -> PHP parse error -> activation exits 255.
function broken_activation_fixture() {
	if ( true ) {
	// missing closing brace here

add_action( 'init', 'broken_activation_fixture' );
