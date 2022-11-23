import scrapy

class ProductsSpider(scrapy.Spider):
    name = 'Products'
    allowed_domains = ['www.pricerunner.dk']
    start_urls = ['http://www.pricerunner.dk/']
    choices = ['Farve', 'Størrelse']

    def parse(self, response):
        for category in response.css("li.yE113W5m69"):
            category_name = category.xpath('a/p/text()').get()
            link = category.css('a::attr(href)').get()
            if link is not None and category_name != 'Black Friday':
                next_page = response.urljoin(link)
                #follow link from main page to category lists
                request = scrapy.Request(next_page,callback=self.parseInCategory)
                request.cb_kwargs['category_name']=category_name
                yield request
    
    def parseInCategory(self, response, category_name):
        for subcategory in response.css("div.pr-1rj4gr0"):
            #open each category to display list of subcategories
            link = subcategory.xpath('div/a/@href').get()
            subcategory_name = subcategory.css('div.pr-13b1e5n').xpath('div/@title').get()
            if link is not None:
                next_page = response.urljoin(link)
                #follow link from category page to subcategory page lists
                request = scrapy.Request(next_page,callback=self.parseInSubCategory)
                request.cb_kwargs['category_name']=category_name
                request.cb_kwargs['subcategory_name']=subcategory_name
                yield request
    
    def parseInSubCategory(self, response, category_name, subcategory_name):
        for item in response.css("div.al5wsmjlcK"):
            #open each item to display information
            link = item.xpath('a/@href').get()
            if link is not None:
                next_page = response.urljoin(link)
                #follow link from category page to subcategory page lists
                request = scrapy.Request(next_page,callback=self.parseInItem)
                request.cb_kwargs['category_name']=category_name
                request.cb_kwargs['subcategory_name']=subcategory_name
                yield request
    
    def parseInItem(self, response, category_name, subcategory_name):
        #PRODUCT INFO
        name = response.css("h1[itemprop=name]::text").get()
        description = response.css("p.pr-sslp0w::text").get()
        rating = response.css("span.pr-1fue7js::text").get()
        price = response.css("span.pr-rchxz9::text").get()
        #subtitle?
        #additional_info: Just a free column. For instance, it could be used to indicate if it is the main photo or part of a gallery.
        #choices: allows adding rows for choices related to the product such as: size, quantity, colors. 
        #IMG INFO
        img = response.css("img[data-testid=productImage]::attr(src)").get()
        alt = response.css("img[data-testid=productImage]::attr(alt)").get()
        #additional_info: Just a free column. For instance, it could be used to indicate availability among the choices. 
        #get additional 
        #product_informantion = response.xpath('//div[has-class("y47Z07Lcqo", "pr-1nzd1qn")]')
        #product_informantion = response.css('div.y47Z07Lcqo.pr-1nzd1qn').get()
        #print("product_info", product_informantion)
        has_additional_info = False
        additional_info = []
        for product_information in response.css('div.FC57OyhG0j.ejNEYYt7Mj'):
            print("XXX",product_information.xpath('span/text()').get())
            if (not has_additional_info and product_information.xpath('span/text()').get() == "Alle"):
                has_additional_info = True
                print("GOT ALLE\n")
            elif (has_additional_info):
                additional_info.append(product_information.xpath('span/text()').get())
            """
            print("product_info", product_information, "\n")
            
            for additional_information in product_information.css('div.ttn_sm0pJI'):
                print("additional_info", additional_information, "\n")
                specific_information = additional_information.xpath('div/span/span/text()').get()
                print ('specific_info',specific_information,"\n")
                if (specific_information and specific_information in self.choices):
                    print("inside\n")
            """
        #ensure most info is present
        if (name and category_name and price and description):
            ###CHECK WITH DB VALUES
            yield {
                'name': name,
                'category_name':category_name,
                'subcategory_name': subcategory_name,
                'rating': rating,
                'link': response.request.url,
                'price': price,
                'description': description,
                'img': img,
                'alt': alt,
                'additional_info': additional_info
            }

        

