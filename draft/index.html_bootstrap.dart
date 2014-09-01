library app_bootstrap;

import 'package:polymer/polymer.dart';

import 'package:core_elements/core_header_panel.dart' as i0;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_toolbar.dart' as i1;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_selection.dart' as i2;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_selector.dart' as i3;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_menu.dart' as i4;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_meta.dart' as i5;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_iconset.dart' as i6;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_icon.dart' as i7;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_item.dart' as i8;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_media_query.dart' as i9;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_drawer_panel.dart' as i10;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_iconset_svg.dart' as i11;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_icon_button.dart' as i12;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_scaffold.dart' as i13;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_pages.dart' as i14;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_localstorage_dart.dart' as i15;
import 'package:polymer/src/build/log_injector.dart';
import 'package:core_elements/core_list_dart.dart' as i16;
import 'package:polymer/src/build/log_injector.dart';
import 'players_page.dart' as i17;
import 'package:polymer/src/build/log_injector.dart';
import 'fantasy_draft_app.dart' as i18;
import 'package:polymer/src/build/log_injector.dart';
import 'index.html.0.dart' as i19;
import 'package:polymer/src/build/log_injector.dart';
import 'package:smoke/smoke.dart' show Declaration, PROPERTY, METHOD;
import 'package:smoke/static.dart' show useGeneratedCode, StaticConfiguration;
import 'package:core_elements/core_localstorage_dart.dart' as smoke_0;
import 'package:polymer/polymer.dart' as smoke_1;
import 'package:observe/src/metadata.dart' as smoke_2;
import 'package:core_elements/core_list_dart.dart' as smoke_3;
import 'package:observe/src/observable_list.dart' as smoke_4;
import 'players_page.dart' as smoke_5;
import 'fantasy_draft_app.dart' as smoke_6;
abstract class _M0 {} // PolymerElement & ChangeNotifier

void main() {
  useGeneratedCode(new StaticConfiguration(
      checkedMode: false,
      getters: {
        #autoSaveDisabled: (o) => o.autoSaveDisabled,
        #data: (o) => o.data,
        #drafted: (o) => o.drafted,
        #dragging: (o) => o.dragging,
        #drawerWidth: (o) => o.drawerWidth,
        #extraItems: (o) => o.extraItems,
        #fantasyPts: (o) => o.fantasyPts,
        #filteredPlayers: (o) => o.filteredPlayers,
        #floor: (o) => o.floor,
        #height: (o) => o.height,
        #icon: (o) => o.icon,
        #id: (o) => o.id,
        #initialize: (o) => o.initialize,
        #label: (o) => o.label,
        #link: (o) => o.link,
        #loaded: (o) => o.loaded,
        #mode: (o) => o.mode,
        #multi: (o) => o.multi,
        #name: (o) => o.name,
        #narrow: (o) => o.narrow,
        #nflFantasyPts: (o) => o.nflFantasyPts,
        #players: (o) => o.players,
        #playersChanged: (o) => o.playersChanged,
        #position: (o) => o.position,
        #positions: (o) => o.positions,
        #queryMatches: (o) => o.queryMatches,
        #responsiveWidth: (o) => o.responsiveWidth,
        #rightDrawer: (o) => o.rightDrawer,
        #scroll: (o) => o.scroll,
        #scrollTarget: (o) => o.scrollTarget,
        #selected: (o) => o.selected,
        #selectedChanged: (o) => o.selectedChanged,
        #selectedHandler: (o) => o.selectedHandler,
        #selectedProperty: (o) => o.selectedProperty,
        #selectionSelect: (o) => o.selectionSelect,
        #src: (o) => o.src,
        #sync: (o) => o.sync,
        #tapHandler: (o) => o.tapHandler,
        #togglePanel: (o) => o.togglePanel,
        #tokenList: (o) => o.tokenList,
        #transition: (o) => o.transition,
        #useRaw: (o) => o.useRaw,
        #value: (o) => o.value,
        #valueChanged: (o) => o.valueChanged,
      },
      setters: {
        #autoSaveDisabled: (o, v) { o.autoSaveDisabled = v; },
        #data: (o, v) { o.data = v; },
        #extraItems: (o, v) { o.extraItems = v; },
        #filteredPlayers: (o, v) { o.filteredPlayers = v; },
        #height: (o, v) { o.height = v; },
        #icon: (o, v) { o.icon = v; },
        #id: (o, v) { o.id = v; },
        #loaded: (o, v) { o.loaded = v; },
        #mode: (o, v) { o.mode = v; },
        #multi: (o, v) { o.multi = v; },
        #name: (o, v) { o.name = v; },
        #narrow: (o, v) { o.narrow = v; },
        #players: (o, v) { o.players = v; },
        #position: (o, v) { o.position = v; },
        #queryMatches: (o, v) { o.queryMatches = v; },
        #responsiveWidth: (o, v) { o.responsiveWidth = v; },
        #scrollTarget: (o, v) { o.scrollTarget = v; },
        #selected: (o, v) { o.selected = v; },
        #selectedProperty: (o, v) { o.selectedProperty = v; },
        #src: (o, v) { o.src = v; },
        #sync: (o, v) { o.sync = v; },
        #useRaw: (o, v) { o.useRaw = v; },
        #value: (o, v) { o.value = v; },
      },
      parents: {
        smoke_6.FantasyDraftApp: _M0,
        smoke_3.CoreList: _M0,
        smoke_0.CoreLocalStorage: _M0,
        smoke_5.PlayersPage: _M0,
        _M0: smoke_1.PolymerElement,
      },
      declarations: {
        smoke_6.FantasyDraftApp: {
          #players: const Declaration(#players, List, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #selected: const Declaration(#selected, String, kind: PROPERTY, annotations: const [smoke_2.reflectable, const smoke_1.PublishedProperty(reflect: true)]),
          #selectedChanged: const Declaration(#selectedChanged, Function, kind: METHOD),
        },
        smoke_3.CoreList: {
          #data: const Declaration(#data, smoke_4.ObservableList, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #extraItems: const Declaration(#extraItems, int, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #height: const Declaration(#height, double, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #initialize: const Declaration(#initialize, Function, kind: METHOD, annotations: const [const smoke_1.ObserveProperty('data template scrollTarget')]),
          #multi: const Declaration(#multi, bool, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #scrollTarget: const Declaration(#scrollTarget, dynamic, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #selected: const Declaration(#selected, dynamic, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #selectedChanged: const Declaration(#selectedChanged, Function, kind: METHOD),
          #selectedProperty: const Declaration(#selectedProperty, String, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #sync: const Declaration(#sync, bool, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
        },
        smoke_0.CoreLocalStorage: {
          #autoSaveDisabled: const Declaration(#autoSaveDisabled, bool, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #loaded: const Declaration(#loaded, bool, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #name: const Declaration(#name, String, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #useRaw: const Declaration(#useRaw, bool, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #value: const Declaration(#value, dynamic, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #valueChanged: const Declaration(#valueChanged, Function, kind: METHOD),
        },
        smoke_5.PlayersPage: {
          #filteredPlayers: const Declaration(#filteredPlayers, List, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_2.observable]),
          #players: const Declaration(#players, List, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
          #playersChanged: const Declaration(#playersChanged, Function, kind: METHOD),
          #position: const Declaration(#position, smoke_6.Position, kind: PROPERTY, annotations: const [smoke_2.reflectable, smoke_1.published]),
        },
      },
      names: {
        #autoSaveDisabled: r'autoSaveDisabled',
        #data: r'data',
        #drafted: r'drafted',
        #dragging: r'dragging',
        #drawerWidth: r'drawerWidth',
        #extraItems: r'extraItems',
        #fantasyPts: r'fantasyPts',
        #filteredPlayers: r'filteredPlayers',
        #floor: r'floor',
        #height: r'height',
        #icon: r'icon',
        #id: r'id',
        #initialize: r'initialize',
        #label: r'label',
        #link: r'link',
        #loaded: r'loaded',
        #mode: r'mode',
        #multi: r'multi',
        #name: r'name',
        #narrow: r'narrow',
        #nflFantasyPts: r'nflFantasyPts',
        #players: r'players',
        #playersChanged: r'playersChanged',
        #position: r'position',
        #positions: r'positions',
        #queryMatches: r'queryMatches',
        #responsiveWidth: r'responsiveWidth',
        #rightDrawer: r'rightDrawer',
        #scroll: r'scroll',
        #scrollTarget: r'scrollTarget',
        #selected: r'selected',
        #selectedChanged: r'selectedChanged',
        #selectedHandler: r'selectedHandler',
        #selectedProperty: r'selectedProperty',
        #selectionSelect: r'selectionSelect',
        #src: r'src',
        #sync: r'sync',
        #tapHandler: r'tapHandler',
        #togglePanel: r'togglePanel',
        #tokenList: r'tokenList',
        #transition: r'transition',
        #useRaw: r'useRaw',
        #value: r'value',
        #valueChanged: r'valueChanged',
      }));
  new LogInjector().injectLogsFromUrl('index.html._buildLogs');
  configureForDeployment([
      i0.upgradeCoreHeaderPanel,
      i1.upgradeCoreToolbar,
      i2.upgradeCoreSelection,
      i3.upgradeCoreSelector,
      i4.upgradeCoreMenu,
      i5.upgradeCoreMeta,
      i6.upgradeCoreIconset,
      i7.upgradeCoreIcon,
      i8.upgradeCoreItem,
      i9.upgradeCoreMediaQuery,
      i10.upgradeCoreDrawerPanel,
      i11.upgradeCoreIconsetSvg,
      i12.upgradeCoreIconButton,
      i13.upgradeCoreScaffold,
      i14.upgradeCorePages,
      () => Polymer.register('core-localstorage-dart', i15.CoreLocalStorage),
      () => Polymer.register('core-list-dart', i16.CoreList),
      () => Polymer.register('players-page', i17.PlayersPage),
      () => Polymer.register('fantasy-draft-app', i18.FantasyDraftApp),
    ]);
  i19.main();
}
