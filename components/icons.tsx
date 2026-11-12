"use client";

import { config, type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowRight,
  faArrowUp,
  faArrowTrendUp,
  faBars,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faCircleHalfStroke,
  faClapperboard,
  faCode,
  faEllipsis,
  faHouse,
  faListUl,
  faMagnifyingGlass,
  faMinus,
  faMugHot,
  faMusic,
  faPause,
  faPiggyBank,
  faPlay,
  faPlus,
  faSliders,
  faTableCellsLarge,
  faTableColumns,
  faWandMagicSparkles,
  faWifi,
  faXmark,
  faCoins,
  faMicrochip,
  faChartLine,
  faArrowRotateRight,
  faGlobe,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBell,
  faCircleQuestion,
  faCreditCard,
  faEye,
  faEyeSlash,
  faHeart,
  faPaperPlane,
} from "@fortawesome/free-regular-svg-icons";
import { faDribbble, faSpotify, faBitcoin, faEthereum, faSolana, faXTwitter } from "@fortawesome/free-brands-svg-icons";

// Next.js loads the supporting CSS once in app/layout.tsx.
config.autoAddCss = false;

export type IconProps = Omit<FontAwesomeIconProps, "icon" | "size" | "strokeWidth"> & {
  size?: number;
  /** Accepted for the existing icon API; Font Awesome glyphs use filled paths. */
  strokeWidth?: number | string;
};

type IconStyle = NonNullable<FontAwesomeIconProps["style"]> & { "--qozmo-icon-size": string };

function createIcon(icon: IconDefinition, transform?: FontAwesomeIconProps["transform"]) {
  return function QozmoIcon({ size = 24, strokeWidth: _strokeWidth, className, style, ...props }: IconProps) {
    const iconStyle: IconStyle = { "--qozmo-icon-size": `${size}px`, ...style };
    const decorative = props["aria-hidden"]
      ?? !(props["aria-label"] || props["aria-labelledby"] || props.title);

    return (
      <FontAwesomeIcon
        icon={icon}
        transform={transform}
        focusable="false"
        aria-hidden={decorative}
        className={["qozmo-icon", className].filter(Boolean).join(" ")}
        style={iconStyle}
        {...props}
      />
    );
  };
}

export const ArrowDown = createIcon(faArrowDown);
export const ArrowDownLeft = createIcon(faArrowDown, "rotate-45");
export const ArrowRight = createIcon(faArrowRight);
export const ArrowUpRight = createIcon(faArrowUp, "rotate-45");
export const Bell = createIcon(faBell);
export const Check = createIcon(faCheck);
export const ChevronDown = createIcon(faChevronDown);
export const ChevronLeft = createIcon(faChevronLeft);
export const CreditCard = createIcon(faCreditCard);
export const Eye = createIcon(faEye);
export const EyeOff = createIcon(faEyeSlash);
export const Home = createIcon(faHouse);
export const MoreHorizontal = createIcon(faEllipsis);
export const Plus = createIcon(faPlus);
export const Radio = createIcon(faWifi);
export const Send = createIcon(faPaperPlane);
export const Sparkles = createIcon(faWandMagicSparkles);
export const TrendingUp = createIcon(faArrowTrendUp);
export const Heart = createIcon(faHeart);
export const LayoutGrid = createIcon(faTableCellsLarge);
export const Menu = createIcon(faBars);
export const Minus = createIcon(faMinus);
export const Pause = createIcon(faPause);
export const Play = createIcon(faPlay);
export const Search = createIcon(faMagnifyingGlass);
export const SlidersHorizontal = createIcon(faSliders);
export const X = createIcon(faXmark);
export const XTwitter = createIcon(faXTwitter);
export const CircleHelp = createIcon(faCircleQuestion);
export const Clapperboard = createIcon(faClapperboard);
export const Command = createIcon(faCode);
export const Dribbble = createIcon(faDribbble);
export const LayoutDashboard = createIcon(faTableColumns);
export const ListFilter = createIcon(faListUl);
export const Music2 = createIcon(faMusic);
export const PiggyBank = createIcon(faPiggyBank);
export const Wifi = createIcon(faWifi);
export const Spotify = createIcon(faSpotify);
export const Coffee = createIcon(faMugHot);
export const Linear = createIcon(faCircleHalfStroke);
export const Bitcoin = createIcon(faBitcoin);
export const Ethereum = createIcon(faEthereum);
export const Solana = createIcon(faSolana);
export const Coins = createIcon(faCoins);
export const Microchip = createIcon(faMicrochip);
export const ChartLine = createIcon(faChartLine);
export const Refresh = createIcon(faArrowRotateRight);
export const Globe = createIcon(faGlobe);
export const Info = createIcon(faCircleInfo);
