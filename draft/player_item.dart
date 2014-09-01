import 'package:polymer/polymer.dart';

import 'fantasy_draft_app.dart';

@CustomTag('player-item')
class PlayerItem extends PolymerElement with ChangeNotifier  {
  @reflectable @published Player get player => __$player; Player __$player; @reflectable set player(Player value) { __$player = notifyPropertyChange(#player, __$player, value); }
  
  PlayerItem.created() : super.created();
}