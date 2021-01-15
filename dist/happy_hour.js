var party_name = "happy_hour";
var room_capacity = 6;
var enable_lobby = false;

var dweet_channel = party_name;

var jitsi_domain = "meet.jit.si";

var cors_proxys = [
   "https://cors-proxy.htmldriven.com/?url=",
   "https://api.codetabs.com/v1/proxy?quest="
 ];

var room_button_list = document.getElementById("room_buttons");
var video_div = document.getElementById("video");
var subject_form = document.getElementById("subject_form");
var jukebox_form = document.getElementById("jukebox_form");
var about_form = document.getElementById("about_form");

var rooms = 
  [ { jitsi_name: party_name + "_1",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room0") },
    { jitsi_name: party_name + "_2",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room1") },
    { jitsi_name: party_name + "_3",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room2") },
    { jitsi_name: party_name + "_4",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room3") },
    { jitsi_name: party_name + "_5",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room4") },
    { jitsi_name: party_name + "_6",
      subject: "",
      headcount: 0,
      headcount_valid: false,
      button: document.getElementById("room5") }
   ] ;


var room_number = -1;

var jitsi = null;

var jukebox = {
  audio: document.getElementById("audio"),
  youtube_player: null,
  enabled: true,
  volume: 25,
  url: ""
};

function about_form_show(show_it) {
  if (show_it == true) {
    jukebox_form.hidden = true;
    video_div.hidden = true;
    subject_form.hidden = true;
    about_form.hidden = false;
  } else {
    video_div.hidden = false;
    subject_form.hidden = true;
    jukebox_form.hidden = true;
    about_form.hidden = true;
  }
}

function onYouTubeIframeAPIReady() {
  console.log("onYouTubeIframeAPIReady");
  jukebox.youtube_player = new YT.Player('youtube_player', {
    height: '1',
    width: '1',
    events: {
      'onReady': onYouTubePlayerReady,
    }
  });
}

function onYouTubePlayerReady(event) {
  event.target.setVolume(jukebox.volume);
  event.target.playVideo();
}

function jukebox_volume_changed() {
  var volume_range = document.getElementById("jukebox_volume");

  jukebox.volume = volume_range.value;
  console.log("jukebox volume " + jukebox.volume);

  jukebox.audio.volume = jukebox.volume / 100;

  if (jukebox.youtube_player != null)
    jukebox.youtube_player.setVolume(jukebox.volume);
}

function jukebox_enable_clicked() {
  var enable_check = document.getElementById("jukebox_enable");

  if (enable_check.checked) {
    jukebox.enabled = true;
  } else {
    jukebox.enabled = false;
    jukebox.audio.pause();
    jukebox.youtube_player.stopVideo();
  }
}

function jukebox_play_clicked() {
  var url_text = document.getElementById("jukebox_url");

  if (url_text.value != "") {
    jukebox_play_url(url_text.value);
  }

  jukebox_form_show(false);
  dweet_music();
}

function jukebox_youtube_vid_from_url(the_url) {
  var youtube_URL = new URL(the_url);
  var youtube_vid = "";

  if (youtube_URL.hostname == "youtu.be") {
    youtube_vid = youtube_URL.pathname.substring(1);
  } else if ((youtube_URL.hostname == "youtube.com") ||
            (youtube_URL.hostname == "www.youtube.com")) {
    youtube_vid = youtube_URL.searchParams.get("v");
  } 

  return youtube_vid;
}

function jukebox_audio_error(e) {
  console.log("oh no, audio_error " + e);
}

function jukebox_play_url(url) {
  jukebox.url = url;

  if (jukebox.enabled) {
    console.log("playing " + url);

    jukebox.audio.pause();

    if (jukebox.youtube_player != null)
      jukebox.youtube_player.stopVideo();

    var youtube_vid = jukebox_youtube_vid_from_url(url);

    if (youtube_vid != "") {

      if (jukebox.youtube_player == null) {
        jukebox.youtube_player = new YT.Player('youtube_player', {
          height: '1',
          width: '1',
          videoId: youtube_vid,
          events: {
            'onReady': onYouTubePlayerReady,
          }
        });
      } else {
        jukebox.youtube_player.loadVideoById(youtube_vid);
        jukebox.youtube_player.setVolume(jukebox.volume);
      }
    } else {
      jukebox.audio.src = url;
      jukebox.audio.onerror = jukebox_audio_error;
      jukebox.audio.play();
      jukebox.audio.volume = jukebox.volume / 100;
    }
  } else {
    console.log("music disabled, not playing " + url);
  }
}

function jukebox_form_show(show_it) {

  if (show_it == true) {
    var url_text = document.getElementById("jukebox_url");
    url_text.value = jukebox.url;

    jukebox_form.hidden = false;
    video_div.hidden = true;
    subject_form.hidden = true;
    about_form.hidden = true;
  } else {
    video_div.hidden = false;
    subject_form.hidden = true;
    jukebox_form.hidden = true;
    about_form.hidden = true;
  }
}

function add_room() {
  new_room_number = rooms.length;

  var new_room = {
      jitsi_name: party_name + "_" + new_room_number,
      subject: "",
      headcount: 0,
      headcount_valid: false };

  new_room.button = document.createElement("input");
  new_room.button.type = "button";
  new_room.button.id = "room" + new_room_number;
  new_room.button.setAttribute("onClick", "join_room(" + new_room_number + ")");
  new_room.button.style = "width:100%";
  new_room.button.value = "Room " + (new_room_number + 1);

  room_button_list.appendChild(new_room.button);
  rooms.push(new_room);
}

function update_room_button(button_room_number) {
  if (rooms[button_room_number].subject != "")
    rooms[button_room_number].button.value = 
      rooms[button_room_number].headcount + ": " +
      rooms[button_room_number].subject;
  else
    rooms[button_room_number].button.value = 
      rooms[button_room_number].headcount + " people";

  if (rooms[button_room_number].headcount > room_capacity) {
    rooms[button_room_number].button.disabled = true;
  } else {
    rooms[button_room_number].button.disabled = false;
  }
}

function subject_form_show(show_it) {
  var subject_text = document.getElementById("subject_text");

  if (show_it == true) {
    subject_text.value = rooms[room_number].subject;
    video_div.hidden = true;
    jukebox_form.hidden = true;
    subject_form.hidden = false;
    about_form.hidden = true;
  } else {
    video_div.hidden = false;
    subject_form.hidden = true;
    jukebox_form.hidden = true;
    about_form.hidden = true;
  }
}

function set_subject() {
  var subject_text = document.getElementById("subject_text");

  jitsi.executeCommand('subject', subject_text.value);
  rooms[room_number].subject = subject_text.value;
  update_room_button(room_number);

  dweet_headcount();
  subject_form_show(false);
}

function join_room(new_room_number) {
  video_div.hidden = false;
  jukebox_form.hidden = true;
  subject_form.hidden = true;
  about_form.hidden = true;

  if (new_room_number != room_number) {
    var options = {
          roomName: rooms[new_room_number].jitsi_name,
          parentNode: document.getElementById("video")
        }

    if (jitsi != null) {
      you_left({roomName:rooms[room_number].jitsi_name});
      jitsi.dispose();
    }

    room_number = new_room_number;

    jitsi = new JitsiMeetExternalAPI(jitsi_domain, options);

    jitsi.addEventListener("participantJoined", someone_joined);
    jitsi.addEventListener("participantLeft", someone_left);
    jitsi.addEventListener("participantRoleChanged", role_changed);
    jitsi.addEventListener("videoConferenceJoined", you_joined);
    jitsi.addEventListener("videoConferenceLeft", you_left);
    jitsi.addEventListener("subjectChange", subject_changed);
    jitsi.addEventListener("dominantSpeakerChanged", speaker_changed);
  }
}

function someone_joined(someone) {
  console.log(someone.id + " named " + someone.displayName + " joined");

  rooms[room_number].headcount = jitsi.getNumberOfParticipants();
  rooms[room_number].headcount_valid = true;

  update_room_button(room_number);
}

function someone_left(someone) {
  console.log(someone.id + " left");

  rooms[room_number].headcount = jitsi.getNumberOfParticipants();
  rooms[room_number].headcount_valid = true;

  update_room_button(room_number);
}

function role_changed(role_change) {
  if (role_change.role === 'moderator') {
    jitsi.executeCommand('toggleLobby', enable_lobby);
  }
}

function you_joined(someone) {
  console.log(someone.id + " named " + someone.displayName +
    " joined " + someone.roomName);
  rooms[room_number].headcount = jitsi.getNumberOfParticipants();
  rooms[room_number].headcount_valid = true;

  update_room_button(room_number);

  dweet_headcount();
}

function you_left(someone) {
  console.log("you left " + someone.roomName);

  if (rooms[room_number].headcount > 0)
    rooms[room_number].headcount--;

  update_room_button(room_number);

  dweet_headcount();
}

function subject_changed(subject) {
  console.log("room subject " + subject.subject);

  rooms[room_number].subject = subject.subject;
  update_room_button(room_number);
}

function speaker_changed(speaker) {
  console.log("speaking now " + speaker.id);
}

function dweet_music() {
   var data = {
     music_url: jukebox.url
   };

  console.log("send media url " + data.music_url);
  dweetio.dweet_for(dweet_channel, data);
}

function dweet_headcount() {
  var data = {
    room: rooms[room_number].jitsi_name,
    subject: rooms[room_number].subject,
    number: room_number,
    headcount: rooms[room_number].headcount
  };

  console.log("send " + data.room + " headcount " + data.headcount);

  dweetio.dweet_for(dweet_channel, data);
}

function dweet_listener(dweet) {
  var data = dweet.content;

  if ((typeof data.room !== 'undefined') &&
      (typeof data.headcount !== 'undefined')) {
    console.log("got " + data.room + " headcount " + data.headcount);

    if (typeof data.subject !== 'undefined')
      rooms[data.number].subject = data.subject;

    if (data.headcount >= 0) {
      rooms[data.number].headcount = data.headcount;

      update_room_button(data.number);
    }
  }

  if (typeof data.music_url !== 'undefined') {
    console.log("got music url " + data.music_url);
    if (jukebox.url != data.music_url) {
      jukebox_play_url(data.music_url);
    }
  }
}

function dweet_ingestion(err, dweets) {
  var valid_count = 0;
  var got_jukebox_url = false;

  for(dweet_index in dweets) {
    var dweet = dweets[dweet_index];
    var data = dweet.content;
 
    if ((typeof data.room !== 'undefined') &&
        (typeof data.headcount !== 'undefined') &&
        (typeof data.number !== 'undefined')) { 
      console.log("got " + data.room + " headcount " +
        data.headcount + " from " + dweet.created);

      if (rooms[data.number].headcount_valid == false) {
        rooms[data.number].headcount_valid = true;
        if (data.headcount >= 0)
          rooms[data.number].headcount = data.headcount;

        if (typeof data.subject !== 'undefined')
          rooms[data.number].subject = data.subject;

        update_room_button(data.number);
        
        if (++valid_count >= rooms.length)
          break;
      }
    }

    // XXX TODO don't play really old stuff
    if ((got_jukebox_url == false) && 
       (typeof data.music_url !== 'undefined')) {
      console.log("got music url " + data.music_url);
      got_jukebox_url = true;
      if (jukebox.url != data.music_url) {
        jukebox_play_url(data.music_url);
      }
    }
  }
}

dweetio.get_all_dweets_for(dweet_channel, dweet_ingestion);
dweetio.listen_for(dweet_channel, dweet_listener);

join_room(0);
