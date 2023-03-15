import aboutIcon from '~/img/moonmage/interface/nav/about.svg';
import moonNFTIcon from '~/img/moonmage/interface/nav/moon-nft.svg';
import discordIcon from '~/img/moonmage/interface/nav/discord.svg';
import githubIcon from '~/img/moonmage/interface/nav/github.svg';
import governanceIcon from '~/img/moonmage/interface/nav/governance.svg';
import swapIcon from '~/img/moonmage/interface/nav/trade.svg';
import twitterIcon from '~/img/moonmage/interface/nav/twitter.svg';
import immunefiIcon from '~/img/moonmage/interface/nav/immunefi.svg';
import docsIcon from '~/img/moonmage/interface/nav/docs.svg';
import disclosuresIcon from '~/img/moonmage/interface/nav/disclosures.svg';
import analyticsIcon from '~/img/moonmage/interface/nav/analytics.svg';

export type RouteData = {
  /** Nav item title */
  title: string;
  /** If set, link to this internal path. */
  path: string;
  /** Tag to show inside the nav item */
  tag?: string;
  /** If set, link out to this external URL. */
  href?: string;
  //
  icon?: string;
  disabled?: boolean;
  small?: boolean;
}

type RouteKeys = 'top' | 'market' | 'more' | 'additional' // | 'analytics'

const ROUTES : { [key in RouteKeys] : RouteData[] } = {
  // Main Navigation
  top: [
    {
      path: '/',
      title: 'Forecast',
    },
    {
      path: '/silo',
      title: 'Silo',
    },
    {
      path: '/field',
      title: 'Field',
    },
    {
      path: '/ship',
      title: 'Ship',
    },
    {
      path: '/balances',
      title: 'Balances',
    },
    {
      path: '/market/buy',
      title: 'Market',
    },
  ],
  // More Menu
  more: [
    {
      path: 'nft',
      title: 'BeaNFTs',
      icon: moonNFTIcon,
      small: true
    },
    {
      path: 'swap',
      title: 'Swap',
      icon: swapIcon,
      small: true
    },
    {
      path: '/analytics',
      title: 'Analytics',
      icon: analyticsIcon,
      small: true
    },
    {
      path: '/governance',
      title: 'Governance',
      icon: governanceIcon,
      small: true
    },
    {
      path: 'docs',
      href: 'https://docs.moon.money/almanac',
      title: 'Docs',
      icon: docsIcon,
      small: true
    },
  ],
  // About Button
  additional: [
    {
      path: 'about',
      title: 'About',
      href: 'https://moon.money',
      icon: aboutIcon
    },
    {
      path: 'disclosures',
      title: 'Disclosures',
      href: 'https://docs.moon.money/almanac/disclosures',
      icon: disclosuresIcon
    },
    {
      path: 'bugbounty',
      title: 'Bug Bounty',
      href: 'https://immunefi.com/bounty/moonmage',
      icon: immunefiIcon
    },
    {
      path: 'discord',
      href: 'https://discord.gg/moonmage',
      title: 'Discord',
      icon: discordIcon
    },
    {
      path: 'twitter',
      href: 'https://twitter.com/moonmagefarms',
      title: 'Twitter',
      icon: twitterIcon
    },
    {
      path: 'github',
      href: 'https://github.com/moonmagefarms',
      title: 'GitHub',
      icon: githubIcon
    },
    {
      path: 'analytics',
      href: 'https://analytics.moon.money',
      title: 'Advanced Analytics',
      icon: analyticsIcon
    },
  ],
  // Market Menu
  market: [
    {
      path: '/market',
      title: 'Pod Market',
    },
    {
      path: '/market/account',
      title: 'My Orders / Listings',
    },
    {
      path: '/market/activity',
      title: 'Marketplace Activity',
    },
  ],
  // Analytics Menu
  // analytics: [
  //   {
  //     path: 'analytics/shipraise',
  //     title: 'Ship Raise Analytics',
  //   },
  //   {
  //     path: 'analytics/moon',
  //     title: 'Moon Analytics',
  //   },
  //   {
  //     path: 'analytics/silo',
  //     title: 'Silo Analytics',
  //   },
  //   {
  //     path: 'analytics/field',
  //     title: 'Field Analytics',
  //   }
  // ],
};

export default ROUTES;
