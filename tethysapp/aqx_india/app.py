from tethys_sdk.base import TethysAppBase, url_map_maker

class AqxIndia(TethysAppBase):
    """
    Tethys app class for Mekong Air Quality Explorer.
    """

    name = 'Air Quality Explorer - Beta Version'
    index = 'aqx_india:home'
    icon = 'aqx_india/images/logo.png'
    package = 'aqx_india'
    root_url = 'aqx_india'
    color = '#000080'
    description = 'View Air Quality and Fire data'
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
                url='aqx_india',
                controller='aqx_india.controllers.home'
            ),
            UrlMap(
                name='get-ts',
                url='aqx_india/get-ts',
                controller='aqx_india.ajax_controllers.get_ts'
            ),
            UrlMap(
                name='gen-legend',
                url='aqx_india/gen-legend',
                controller='aqx_india.ajax_controllers.gen_legend'
            ),
            UrlMap(
                name='gen-style',
                url='aqx_india/gen-style',
                controller='aqx_india.ajax_controllers.gen_style'
            ),
            UrlMap(
                name='gen-times',
                url='aqx_india/get-times',
                controller='aqx_india.ajax_controllers.get_times'
            ),
            UrlMap(
                name='gen-gif',
                url='aqx_india/gen-gif',
                controller='aqx_india.ajax_controllers.gen_gif'
            ),
        )

        return url_maps
