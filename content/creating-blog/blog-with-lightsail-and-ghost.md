---
emoji: 🔮
title: Amazon (Lightsail + Route53) + Ghost로 개인 블로그 만들기
date: '2019-09-05'
tags: AWS Lightsail Ghost Nginx
author: fleta
categories: Tech
---

이번에 AWS lightsail + Route53, ghost 로 블로그를 새로 만들게 되었다. 블로그를 세팅하는 과정에 대해 기록한다.

## 1. Amazon lightsail

[Amazon Lightsail page](https://aws.amazon.com/ko/lightsail/) 에서 Lightsail에 대한 소개를 볼 수 있다.
기존에 계정이 없었다면 계정을 생성해야 하며 계정을 생성하는 과정에서 $1 의 시험 결제가 이루어졌다가 취소된다. VISA 등 해외 결제가 되는 카드가 있는지 확인이 필요하다.

인스턴스는 [Amazon Lightsail - Create an instance](https://lightsail.aws.amazon.com/ls/webapp/create/instance?region=ap-northeast-2) 페이지에서 만들 수 있다. 
본인은 `ubuntu 16.04`에 `OS only` 옵션으로 생성하였고, 플랜은 가장 싼 플랜($3.50 per month) 으로 생성했다. 이후에 플랜을 변경할 수 있고 변경하는 과정도 크게 어렵지는 않으니 일단 싼 걸로 진행했다.

## 2. 서버 세팅

인스턴스가 생성되었다면 관리 페이지로 접속하여 Static IP를 발급 받는다. **Networking 탭**에서 IP 정보를 확인할 수 있는데, `Create static IP` 버튼을 눌러 Static IP를 발급받을 수 있다. 인스턴스를 재기동해도 바뀌지 않는 IP의 확보를 위해 Static IP의 발급이 필요하다.

**Firewall** 을 보면 SSH와 HTTP 포트가 기본적으로 허용되어 있는데, 이후 nginx세팅 및 SSL 적용을 위해 HTTPS를 추가하여 443 포트를 허용해준다.

인스턴스에 SSH접속을 하기 위해서는 private key가 필요하다. 인스턴스를 생성한 지역에 맞게 key pair를 다운로드 받고 아래와 같이 접속할 수 있다.
```bash
ssh -i [pem file path] ubuntu@[static ip]
```
만약 파일 권한에 문제가 있을 경우 `chmod 600 [pem file path]` 로 파일 권한 수정을 할 수 있다.

## 3. 도메인 구매

사실 블로그를 아이피 치고 들어가는 사람은 없기에.. 도메인을 구해서 붙이기도 했다. 좋아하는 캐릭터의 성을 도메인으로 쓰고 싶어서 서브컬쳐 관련 도메인을 구할 때 가장 많이 쓰는 `.moe` 도메인을 구입했다.

도메인 구매는 [dynadot](https://www.dynadot.com/) 에서 진행했다. `.moe` 도메인 같은 경우 보통 $20 선에서 구할 수 있는데, Godaddy 같은 경우 $26 정도를 요구했기에 $16를 요구하는 dynadot에서 구매했다. 
로그인 이후 메인페이지에서 도메인을 검색하고 구매할 수 있으면 구매하면 된다.

## 4. 네임서버 / 레코드 설정

dynadot을 사용하면서 nameserver나 레코드 관리 개인적으로 UX가 별로인 것 같아 Amazon Route 53에서 관리하기로 했다.
[Amazon console](https://console.aws.amazon.com/) 의 **네트워킹 및 콘텐츠 전송** 대분류에 **Route 53** 에서 세팅이 가능하다. 

**[호스팅 영역] -> [호스팅 영역 생성]** 으로 새 호스팅 영역을 생성하면 NS, SOA가 자동으로 세팅된다. 나머지 A, CNAME 레코드를 필요에 따라 세팅하면 된다..
본인의 경우 메인 도메인 yuigahama.moe와 블로그용 서브도메인 blog.yuigahama.moe를 위에서 받은 Static IP와 연결시켰다.
적용되기 까지 시간이 어느정도 걸릴 수 있고 적용이 되었다면 도메인을 통해 서버에 접속할 수 있다. 

```bash
ssh -i [pem file path] ubuntu@[domain]
```

## 5. 서버 세팅 

EC2 같은 경우 우분투 서버에서 [locale 관련 이슈가 있다.](https://stackoverflow.com/questions/12016318/aws-ec2-en-us-utf-8-issue) Lightsail에도 기본 인코딩은 설정이 안 되어있기에 해준다.

```bash
vi /etc/environment

LANG=en_US.utf-8
LC_ALL=en_US.utf-8
```

저렴한 인스턴스를 쓰다 보니 메모리가 낮은 편이다. Ghost는 권장 사양으로 1G의 메모리를 요구하므로, Swap 설정이 필요하다.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

블로그 서비스의 계정을 분리하고 superuser에 추가한다.
**_주의: 사용자 이름을 ghost로 설치하면 ghost 설치 과정에서 계정명이 중복된다._**

```bash
sudo adduser [username]
sudo usermod -aG sudo [username]
su - [username]
```

apt를 사용하기 전 업데이트를 하고 필수 패키지들을 세팅한다. 
```bash
sudo apt update && sudo apt install build-essential libssl-dev curl
```

그리고 nginx와 mysql을 설치한다.

```bash
sudo apt install nginx
sudo ufw allow 'Nginx Full'

sudo apt install mysql-server
```

Ghost는 Node.js 를 바탕으로 돌아가고, [ghost documentation](https://ghost.org/faq/node-versions/) 에서 권장하는 Node 버전은 v10.x 한다.
추후 버전 관리의 편리함을 위해 NVM 으로 세팅한다.

```bash
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh -o install_nvm.sh
source ~/.bashrc

nvm install 10.16.3
```

## 6. Ghost 세팅

ghost-cli를 설치한 후 ghost를 설치한다.

```bash
sudo npm install -g ghost-cli

sudo mkdir -p /var/www/ghost
sudo chown [username]:[username] /var/www/ghost
sudo chmod 775 /var/www/ghost

cd /var/www/ghost
ghost install
```

중간에 몇가지 정보를 물어보는데, 도메인, mysql host/user/password/ghost_database_name 정도를 물어본다. 데이터베이스 이름은 ghost_prod 정도로 하면 될 듯 하다. Nginx 세팅은 했고, SSL 세팅은 하지 않았다. Systemd 세팅을 했고, Ghost 도 함께 시작한다.

이 과정까지 진행했으면 블로그를 사용할 수 있게 된다. 도메인을 통해 접속하면 기본적으로 세팅되는 블로그가 나올 것이고, `/ghost` (또는 `/admin`) 경로로 어드민 페이지를 세팅할 수 있다.


## 7. SSL 설정

무료 SSL인증서의 경우 보통 letsencrypt를 통해 발급받는데, 과정이 조금 귀찮다. 이런 귀찮은 과정을 간소하기 위해 `certbot` 을 사용할 수 있다. Nginx 설정까지 알아서 해주니 편하다.

- 설치

```bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt update
sudo apt install python-certbot-nginx
```

- 인증서 발급

```bash
sudo cerbot --nginx -d ${domain}
```

발급하는 과정에서 여러가지 묻는데 읽고 원하는 대로 답하면 된다. 약관 동의 여부, 리다이렉트 여부 등을 물어본다.


## 8. Nginx 설정

1에서 설명한 대로 SSL을 발급받으면 보통은 자동으로 설정된다. 그게 아닌 경우는 어떻게 할 지 생각하며 아래의 글을 작성했다.

블로그의 주소는 현재 `blog.yuigahama.moe`인데, 메인 도메인인 `yuigahama.moe`에도 다른 웹 서비스가 올라가 있다. ghost로 블로그를 올리면서 SSL를 사용하도록 설정했다면 생성된 ghost 폴더의 하위 경로에서 nginx 설정을 발견할 수 있다. 특별히 경로를 바꾸지 않았다면 `/system/files/${blog_domain}.conf` 파일이 그 파일이다. `location` 블록 설정은 되어 있겠지만 블로그만 먼저 세팅하고 ssl 인증서를 받은 경우 ssl_certificate 관련 설정이 안 되어있을 것이다.

```bash
    ssl_certificate /etc/letsencrypt/live/${blog_domain}/fullchain.pem; 
    ssl_certificate_key /etc/letsencrypt/live/${blog_domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf; 
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; 
```

ghost에서 제공하는 설정으로 nginx를 설정했다면 `/etc/nginx/sites-available/`에 위에서 얘기한 파일을 가리키는 링크가 있을 것이다. 같은 디렉토리 안에 메인 도메인 이름으로 파일을 하나 만들어준다. 필자의 경우 `yuigahama.moe.conf`가 된다. 파일에 아래와 같은 내용을 작성해서 메인 도메인에 대한 nginx 설정을 지정한다.

```bash
server {

    server_name yuigahama.moe;

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_pass ${service_host_port};
    }

    location ~/.well-known {
        allow all;
    }

    client_max_body_size 50m;

    listen [::]:443 ssl ipv6only=on; 
    listen 443 ssl; 
    ssl_certificate ${path of fullchain.pem}; 
    ssl_certificate_key ${path of privkey.pem}; 
    include /etc/letsencrypt/options-ssl-nginx.conf; 
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; 
}
```

인증서를 어떻게 발급받았는지에 따라 파일 경로 등이나 사용되는 변수들이 조금 다를 수 있겠지만, 그래도 프록시/포트/SSL경로/body_size 등의 설정이 들어간다는 점만 이해하면 될 것이다.


## 9. 테마 및 폰트 변경

테마의 경우 어드민 페이지의 **Design** 메뉴에서 편집할 수 있다. **Theme Marketplace**에서는 무료/유료인 스킨들을 공유하며 다른 오픈소스 커뮤니티에 테마가 올라오는 경우도 있다. 나는 [attila](https://github.com/zutrinken/attila) 테마를 사용하였다. Theme Marketplace에도 등록되어 있다. 테마가 압축된 파일을 Design탭에서 업로드 하면 된다.

attila 테마 같은 경우는 외국에서 만든 폰트여서 그런지 post의 body 기본 font-family가 'Cardo', sans-serif로 되어있는데 둘 다 한글폰트가 매우 별로다. 하나는 한글 폰트가 지원되지 않아 기본 폰트처럼 나오고 sans-serif는... (이하 생략) 또한 css에 `word-break: keep-all` 이 적용이 안 되어 있는데 개인적으로 되게 싫어해서 이것도 수정하였다. 

attila의 경우 `/assets/css/font` 에 폰트 파일을 두고 font-face 정의는 `/src/sass/_fonts.scss`에서 하고 있다. 기존에 사용되던 폰트들은 svg, ttf, woff, woff2 의 다양한 파일들로 font-face를 정의하고 있지만 나는 성의가 없어서 그런지 truetype(ttf) 만 넣고 font-face도 마찬가지로 truetype의 normal, italic에 대해서만 정의했다. 

이렇게 정의한 font-face는 `/src/sass/style.scss` 에서 import해서 사용된다. scss파일의 body블록이 실제로 본문에 적용되는 css이므로 해당 블록에서 font-family를 바꾸고 다른 css 속성을 추가하거나 편집한 뒤 빌드하고 zip파일로 압축하여 업로드만 하면 변경된 테마를 적용시킬 수 있다.