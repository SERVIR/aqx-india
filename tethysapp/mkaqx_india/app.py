from tethys_sdk.base import TethysAppBase, url_map_maker

class MkaqxIndia(TethysAppBase):
    """
    Tethys app class for Mekong Air Quality Explorer.
    """

    name = 'Air Quality Explorer - Beta Version'
    index = 'mkaqx_india:home'
    icon = 'mkaqx_india/images/logo.png'
    package = 'mkaqx_india'
    root_url = 'mkaqx_india'
    color = '#000080'
    description = 'View Air Quality and Fire data in in the Mekong region'
    tags = 'Air Quality'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='mkaqx_india',
                controller='mkaqx_india.controllers.home'
            ),
            UrlMap(
                name='get-ts',
                url='mkaqx_india/get-ts',
                controller='mkaqx_india.ajax_controllers.get_ts'
            ),
            UrlMap(
                name='gen-legend',
                url='mkaqx_india/gen-legend',
                controller='mkaqx_india.ajax_controllers.gen_legend'
            ),
            UrlMap(
                name='gen-style',
                url='mkaqx_india/gen-style',
                controller='mkaqx_india.ajax_controllers.gen_style'
            ),
            UrlMap(
                name='gen-times',
                url='mkaqx_india/get-times',
                controller='mkaqx_india.ajax_controllers.get_times'
            ),
            UrlMap(
                name='gen-gif',
                url='mkaqx_india/gen-gif',
                controller='mkaqx_india.ajax_controllers.gen_gif'
            ),
        )

        return url_maps
