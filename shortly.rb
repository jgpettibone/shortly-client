require 'sinatra'
require "sinatra/reloader" if development?
require 'active_record'
require 'digest/sha1'
require 'pry'
require 'uri'
require 'open-uri'
require 'bcrypt'
require 'tux'
# require 'nokogiri'

###########################################################
# Configuration
###########################################################

set :public_folder, File.dirname(__FILE__) + '/public'

configure :development, :production do
    ActiveRecord::Base.establish_connection(
       :adapter => 'sqlite3',
       :database =>  'db/dev.sqlite3.db'
     )
end

# Handle potential connection pool timeout issues
after do
    ActiveRecord::Base.connection.close
end

# turn off root element rendering in JSON
ActiveRecord::Base.include_root_in_json = false

###########################################################
# Models
###########################################################
# Models to Access the database through ActiveRecord.
# Define associations here if need be
# http://guides.rubyonrails.org/association_basics.html

class Link < ActiveRecord::Base
    has_many :clicks

    validates :url, presence: true

    before_save do |record|
        record.code = Digest::SHA1.hexdigest(url)[0,5]
    end
end

class Click < ActiveRecord::Base
    belongs_to :link, counter_cache: :visits
end

class User < ActiveRecord::Base
  has_secure_password

  def authenticate(password)
    self.password_digest == BCrypt::Engine.hash_secret(password, self.salt)
  end

  validates :username, presence: true, length: { maximum: 50 }, uniqueness: true
  validates :password, length: { minimum: 6 }
  before_create do |record|
    record.salt = BCrypt::Engine.generate_salt
    record.password_digest = BCrypt::Engine.hash_secret(record.password, record.salt)
    record.token = Digest::SHA1.hexdigest record.to_s
  end
end

###########################################################
# Routes
###########################################################

get '/' do
    erb :index
end

get '/links' do
    links = Link.order("created_at DESC")
    links.map { |link|
        link.as_json.merge(base_url: request.base_url)
    }.to_json
end

post '/links' do
    data = JSON.parse request.body.read
    uri = URI(data['url'])
    raise Sinatra::NotFound unless uri.absolute?
    link = Link.find_by_url(uri.to_s) ||
           Link.create( url: uri.to_s, title: get_url_title(uri) )
    link.as_json.merge(base_url: request.base_url).to_json
end

get '/:url' do
    link = Link.find_by_code params[:url]
    raise Sinatra::NotFound if link.nil?
    link.clicks.create!
    redirect link.url
end

post '/login' do
  data = JSON.parse request.body.read
  user = User.find_by_username data['username']
  if user.nil? or !user.authenticate data['password']
    {token: ''}.to_json
  else
    {token: user.token}.to_json
  end
end

post '/register' do
  data = JSON.parse request.body.read
  user = User.create( username: data['username'],
                      password: data['password'],
                      password_confirmation: data['passwordConfirmation'])
  if user.errors.any?
    {token: ''}.to_json
  else
    {token: user.token}.to_json
  end
end

###########################################################
# Utility
###########################################################

def read_url_head url
    head = ""
    url.open do |u|
        begin
            line = u.gets
            next  if line.nil?
            head += line
            break if line =~ /<\/head>/
        end until u.eof?
    end
    head + "</html>"
end

def get_url_title url
    # Nokogiri::HTML.parse( read_url_head url ).title
    result = read_url_head(url).match(/<title>(.*)<\/title>/)
    result.nil? ? "" : result[1]
end
