export const categories = [
  { id: 'all', name: '全部名山' },
  { id: 'wuyue', name: '三山五岳' },
  { id: 'buddhist', name: '佛教名山' },
  { id: 'others', name: '自由探索' }
];

// status: 'none' | 'wishlist' | 'visited'
// visible: true | false
export const initialMountains = [
  // ================= 三山五岳 =================
  {
    id: 'ts', name: '泰山', category: 'wuyue', value: [117.1, 36.25, 100],
    label: '五岳独尊', province: '山东', icon: '/src/assets/mountains/ts.jpg', status: 'visited', visible: true,
    description: '五岳之首，中华文明的象征。自古便有"泰山安，四海皆安"的说法。历代帝王封禅之地，十八盘步步高升，日出云海极为壮观。'
  },
  {
    id: 'hs', name: '华山', category: 'wuyue', value: [110.08, 34.48, 100],
    label: '奇险天下第一', province: '陕西', icon: '🧗', status: 'none', visible: false,
    description: '西岳华山，以险峻著称。长空栈道、鹞子翻身让人心惊胆战。自古华山一条路，是武侠文化与道教修行的重要圣地。'
  },
  {
    id: 'hgs', name: '衡山', category: 'wuyue', value: [112.7, 27.3, 100],
    label: '南岳独秀', province: '湖南', icon: '🌿', status: 'none', visible: false,
    description: '南岳衡山，气候条件较其他四岳更为优越，处处是茂林修竹，终年翠绿。以"南岳独秀"之美名闻名天下。'
  },
  {
    id: 'hss', name: '恒山', category: 'wuyue', value: [113.73, 39.67, 100],
    label: '塞外第一山', province: '山西', icon: '🏯', status: 'none', visible: false,
    description: '北岳恒山，横亘塞外，自古为兵家必争之地。最为惊险奇绝的当属建于悬崖峭壁上的悬空寺，体现了古人卓越的建筑智慧。'
  },
  {
    id: 'ss', name: '嵩山', category: 'wuyue', value: [112.93, 34.48, 100],
    label: '中岳禅宗', province: '河南', icon: '🥋', status: 'none', visible: false,
    description: '中岳嵩山，不仅拥有世界地质公园的奇观，更是中国功夫的发源地少林寺所在，三教合流，文化底蕴深厚。'
  },
  {
    id: 'huang', name: '黄山', category: 'wuyue', value: [118.1542, 30.1337, 100],
    label: '天下第一奇山', province: '安徽', icon: '/src/assets/mountains/huang.jpg', status: 'wishlist', visible: true,
    description: '"五岳归来不看山，黄山归来不看岳"。以奇松、怪石、云海、温泉、冬雪"五绝"闻名于世，是水墨山水的现实写照。'
  },
  {
    id: 'ls', name: '庐山', category: 'wuyue', value: [115.98, 29.58, 100],
    label: '匡庐奇秀', province: '江西', icon: '瀑', status: 'none', visible: false,
    description: '"不识庐山真面目，只缘身在此山中"。庐山以雄、奇、险、秀闻名，这里的飞瀑和避暑别墅群承载了无数文人墨客的诗词。'
  },
  {
    id: 'yds', name: '雁荡山', category: 'wuyue', value: [121.05, 28.38, 100],
    label: '海上名山', province: '浙江', icon: '🌊', status: 'none', visible: false,
    description: '史称"东南第一山"。以山水奇秀闻名，是中国独一无二的白垩纪流纹质破火山，素有"海上名山、寰中绝胜"之誉。'
  },

  // ================= 四大佛教名山 =================
  {
    id: 'wts', name: '五台山', category: 'buddhist', value: [113.6, 39.02, 100],
    label: '文殊菩萨道场', province: '山西', icon: '📿', status: 'none', visible: false,
    description: '中国佛教四大名山之首。拥有极具规模的寺庙建筑群，不仅是佛教圣地，也拥有壮丽的高山草甸自然风光。'
  },
  {
    id: 'pts', name: '普陀山', category: 'buddhist', value: [122.38, 29.98, 100],
    label: '海天佛国', province: '浙江', icon: '🪷', status: 'none', visible: false,
    description: '观音菩萨的道场。四面环海，风光旖旎，寺院依山傍水而建。这里有着"南海圣境"的幽静与神圣。'
  },
  {
    id: 'ems', name: '峨眉山', category: 'buddhist', value: [103.3344, 29.5451, 100],
    label: '云海佛光', province: '四川', icon: '/src/assets/mountains/ems.jpg', status: 'wishlist', visible: true,
    description: '普贤菩萨的道场。山势雄伟，秀甲天下。金顶的佛光、云海、日出是极其震撼的自然奇观，沿途还有灵猴相伴。'
  },
  {
    id: 'jhs', name: '九华山', category: 'buddhist', value: [117.8, 30.48, 100],
    label: '莲花佛国', province: '安徽', icon: '🕯️', status: 'none', visible: false,
    description: '地藏菩萨的道场。山势如同一朵绽放的莲花，香火鼎盛，留存了众多肉身菩萨，是探寻佛教神秘文化的首选之地。'
  },

  // ================= 自由探索 =================
  {
    id: 'fjs', name: '梵净山', category: 'others', value: [108.6923, 27.8982, 100],
    label: '天空之城', province: '贵州', icon: '/src/assets/mountains/fjs.jpg', status: 'wishlist', visible: true,
    description: '武陵山脉的主峰，世界自然遗产。红云金顶拔地而起，蘑菇石傲然挺立。这里是一座拥有古老地质史的孤岛秘境。'
  },
  {
    id: 'wgs', name: '武功山', category: 'others', value: [114.1003, 27.4845, 100],
    label: '云中草原', province: '江西', icon: '/src/assets/mountains/wgs.jpg', status: 'wishlist', visible: true,
    description: '中国十大非著名山峰之一。拥有海拔1600米以上的十万亩高山草甸，是徒步和露营爱好者的天堂，云海星空绝美。'
  },
  {
    id: 'cbs', name: '长白山', category: 'others', value: [128.0553, 42.0062, 100],
    label: '关东第一山', province: '吉林', icon: '/src/assets/mountains/cbs.jpg', status: 'visited', visible: true,
    description: '休眠火山，拥有奇特的火山口湖——天池。以“神山、圣水、奇林、仙果”等闻名，一年四季风光各异，冬季更是冰雪的童话世界。'
  },
  {
    id: 'ljs', name: '老君山', category: 'others', value: [111.6483, 33.7228, 100],
    label: '天下无双圣境', province: '河南', icon: '/src/assets/mountains/ljs.jpg', status: 'visited', visible: true,
    description: '伏牛山的主峰，相传为道教始祖老子归隐修炼之地。峰林景观如刀劈斧削，金顶道观群屹立于群峰之巅，云海日出宛如仙境。'
  },
  {
    id: 'dcs', name: '稻城亚丁', category: 'others', value: [100.31, 28.38, 100],
    label: '蓝色星球净土', province: '四川', icon: '🏔️', status: 'none', visible: false,
    description: '这里有雪山、冰川、峡谷、森林、草甸、湖泊。被誉为"水蓝色星球上的最后一片净土"，三座神山巍峨圣洁。'
  }
];
