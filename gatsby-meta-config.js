module.exports = {
  title: `fleta.github.io`,
  description: `personal blog`,
  language: `ko`, // `ko`, `en` => currently support versions for Korean and English
  siteUrl: `https://fleta.github.io`,
  ogImage: `/og-image.png`, // Path to your in the 'static' folder
  comments: {
    utterances: {
      repo: ``, // `zoomkoding/zoomkoding-gatsby-blog`,
    },
  },
  ga: '0', // Google Analytics Tracking ID
  author: {
    name: `fleta`,
    bio: {
      role: `software engineer`,
      description: ['안녕하세요.', '반갑습니다.', '잡담을 올립니다.'],
      thumbnail: 'bunong.png', // Path to the image in the 'asset' folder
    },
    social: {
      github: `https://github.com/fleta`, 
      linkedIn: ``, 
      email: ``, 
    },
  },

  // metadata for About Page
  about: {
    timestamps: [
      // =====       [Timestamp Sample and Structure]      =====
      // ===== 🚫 Don't erase this sample (여기 지우지 마세요!) =====
      {
        date: '',
        activity: '',
        links: {
          github: '',
          post: '',
          googlePlay: '',
          appStore: '',
          demo: '',
        },
      },
      // ========================================================
      // ========================================================
      {
        date: '2020.11.02 ~',
        activity: '',
        links: {
          post: '',
          github: '',
          demo: '',
        },
      },
    ],

    projects: [
      // =====        [Project Sample and Structure]        =====
      // ===== 🚫 Don't erase this sample (여기 지우지 마세요!)  =====
      {
        title: '',
        description: '',
        techStack: ['', ''],
        thumbnailUrl: '',
        links: {
          post: '',
          github: '',
          googlePlay: '',
          appStore: '',
          demo: '',
        },
      },
      // ========================================================
      // ========================================================
      {
        title: '',
        description:
          '',
        techStack: [''],
        thumbnailUrl: '',
        links: {
          post: '/creating-blog/start-gatsby-blog-1/',
          github: 'https://github.com/fleta/fleta.github.io',
          demo: 'https://fleta.github.io',
        },
      },
    ],
  },
};
