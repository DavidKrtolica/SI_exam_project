import scrapy
import re

class ProductsSpider(scrapy.Spider):
    name = 'Products'
    allowed_domains = ['pricerunner.dk']
    start_urls = ['http://www.pricerunner.dk/']
    choices = ['Farve', 'Størrelse']

    def parse(self, response):
        for category in response.css("li.yE113W5m69"):
            category_name = category.xpath('a/p/text()').get()
            link = category.css('a::attr(href)').get()
            #print("FOUND category", category_name, "link", link)
            if link is not None and category_name != 'Black Friday':
                next_page = response.urljoin(link)
                #follow link from main page to category lists
                request = scrapy.Request(next_page,callback=self.parseInCategory)
                request.cb_kwargs['category_name']=category_name
                yield request
    
    def parseInCategory(self, response, category_name):
        for subcategory in response.css("div.pr-1q5cn7p"):
            #open each category to display list of subcategories
            link = subcategory.xpath('div/a/@href').get()
            subcategory_name = subcategory.css('div.pr-13b1e5n').xpath('div/@title').get()
            #print("FOUND subcategory", subcategory_name, "link", link)
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
            #print("FOUND item", item, "link", link)
            if link is not None and "gotostore" not in link:
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
        property_index = -1
        for product_information in response.css('div.FC57OyhG0j.ejNEYYt7Mj').xpath('label'):
            information_value = product_information.xpath('span/text()').get()
            if (information_value == "Alle"):
                if (not has_additional_info):
                    has_additional_info = True
                additional_info.append([])
                property_index += 1
            elif (has_additional_info):
                additional_info[property_index].append(information_value)
        color = []
        size = []
        for type in additional_info:
            if re.search("^[A-Z][a-zåæø].+$", type[0]):
                color = type
            else:
                size = type
        #size - digits or capital letters mixed with digits
        #color - capital letter followd by lowercase
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
                'color': color,
                'size': size
            }

        

