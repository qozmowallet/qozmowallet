import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faRocket, faWallet, faKey, faArrowDown, faArrowUp, faLayerGroup, faChartLine, faGlobe, faShieldHalved, faLock, faBoxArchive, faClockRotateLeft, faCode, faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import type { DocIcon } from '@/lib/docs-content';
const icons = {welcome:faBookOpen,rocket:faRocket,wallet:faWallet,key:faKey,receive:faArrowDown,send:faArrowUp,layers:faLayerGroup,assets:faChartLine,network:faGlobe,quantum:faShieldHalved,shield:faLock,backup:faBoxArchive,activity:faClockRotateLeft,code:faCode,help:faCircleQuestion};
export function DocsIcon({name,className=''}:{name:DocIcon;className?:string}) { return <FontAwesomeIcon icon={icons[name]} className={`qdocs-icon ${className}`} aria-hidden="true"/>; }
