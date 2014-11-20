
// load Stylesheet IE/other
if (document.createStyleSheet) {
	document.createStyleSheet('wizards/markdown/font/css/fontello.css')
	document.createStyleSheet('wizards/markdown/css/markdown-extra-editor.css')
} else {
	$('head').append( $("<link rel='stylesheet' href='wizards/markdown/font/css/fontello.css' type='text/css' /><link rel='stylesheet' href='wizards/markdown/css/markdown-extra-editor.css' type='text/css'/>"))
}

<?php
echo file_get_contents(__DIR__ . '/js/markdown-extra-editor.js');
echo file_get_contents(__DIR__ . '/js/markdown-extra-editor.js');

?>

(function( $ )
{
	$.fn.markdown = function()
	{
        var id = this.attr('name');
        this.addClass('nosize').parent().css('height','500px').attr('id', 'meecontainer_'+id);
        window['mee_'+id] = new mee;
        window['mee_'+id].init('meecontainer_'+id);
	};
})( jQuery );
