function loadJquery(){
    $(document).ready(function(){
        $("#toggle-sidebar").click(function(){
            $('.ui.sidebar')
                .sidebar('toggle')
            ;
        });
        
    });
}
