import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ImageBackground,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
  Share,
  Linking,
  Clipboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import BlinkingStars from '../components/BlinkingStars';
import { createSpace, uploadImage } from '../services/api';

const { width } = Dimensions.get('window');

// Religious / Cultural themes that drive custom backgrounds
const RELIGION_THEMES: Record<string, string[]> = {
  HINDU: [
    'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?q=80&w=1200', // Garland exchange / Henna / Red Bride
    'https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?q=80&w=1200', // Mandap sacred fire
    'https://images.unsplash.com/photo-1609137882611-3a1b5fa5d836?q=80&w=1200', // Indian Marigolds
  ],
  SIKH: [
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200', // Golden traditional dress
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1200', // Sparkling golden lights
  ],
  MUSLIM: [
    'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200', // Emerald warm decor
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200', // Elegant silver/gold festival lights
  ],
  CHRISTIAN: [
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200', // White lights decor
    'https://images.unsplash.com/photo-1505232458729-44772f364dd7?q=80&w=1200', // White floral arches
  ],
  OTHER: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200', // Multi-color sparkle event
    'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?q=80&w=1200', // Traditional flowers
  ]
};

// Premium aesthetic event-type default background images (used if no custom couple/star photo is added)
const DEFAULT_EVENT_PHOTOS: Record<string, string> = {
  WEDDING: 'default_wedding',
  BIRTHDAY: 'default_birthday',
  ANNIVERSARY: 'default_anniversary',
  KITTY: 'default_kitty',
  OTHER: 'default_other',
};

// Popular timeline suggestions by event type
const PROGRAM_SUGGESTIONS: Record<string, string[]> = {
  WEDDING: ['Haldi Ceremony', 'Mehndi Program', 'Sangeet Night', 'Baraat Arrival', 'Saat Phere', 'Grand Reception'],
  BIRTHDAY: ['Welcome Drinks', 'Maata Ki Chowki', 'Cake Cutting', 'Magic Show', 'Grand Dinner', 'Dance Floor'],
  ANNIVERSARY: ['Couple Grand Entry', 'Cake Cutting', 'Skit/Performances', 'Couple Dance', 'Dinner'],
  KITTY: ['Welcome Drink', 'Tambola/Bingo', 'Gossip Session', 'High Tea', 'Gift Exchange'],
  OTHER: ['Welcome Pooja', 'Aarti & Prasad', 'Guest Arrival', 'Ganesh Vandana', 'Dinner'],
};

interface CreateEventScreenProps {
  authToken: string | null;
  onBack: () => void;
  onEventCreated: (eventData: any) => void;
}

interface TimelineItem {
  id: string;
  title: string;
  time: string;
  venue: string;
  dayNumber: number;
  dressCode?: string;
  mealOptions?: string;
}

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const calculateEndDate = (start: string, duration: number): string => {
  if (!start) return '';
  const d = new Date(start);
  d.setDate(d.getDate() + (duration - 1));
  return d.toISOString().split('T')[0];
};

export default function CreateEventScreen({ authToken, onBack, onEventCreated }: CreateEventScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);

  // STEP 1 FIELDS: Combined Core info
  const [eventType, setEventType] = useState<'WEDDING' | 'ANNIVERSARY' | 'BIRTHDAY' | 'KITTY' | 'OTHER'>('WEDDING');
  const [religion, setReligion] = useState<'HINDU' | 'SIKH' | 'MUSLIM' | 'CHRISTIAN' | 'OTHER'>('HINDU');
  const [coverUrl, setCoverUrl] = useState('default_wedding');
  const [starPhoto, setStarPhoto] = useState<string | null>(null);

  const [eventName, setEventName] = useState('');
  const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
  const [uploadingStar, setUploadingStar] = useState(false);

  const [startDate, setStartDate] = useState('2026-12-25');
  const [durationDays, setDurationDays] = useState<number>(1);
  const [venue, setVenue] = useState('');
  const [locationLink, setLocationLink] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('We are excited to celebrate with you!');

  // Custom Inline Calendar state
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(11); // December (11-indexed)

  // VIP Contacts (based on event focus type)
  const [person1Name, setPerson1Name] = useState('');
  const [person1Phone, setPerson1Phone] = useState('');
  const [person2Name, setPerson2Name] = useState('');
  const [person2Phone, setPerson2Phone] = useState('');
  const [person3Name, setPerson3Name] = useState(''); // Host details for general
  const [person3Phone, setPerson3Phone] = useState('');

  // STEP 2 FIELDS: Dynamic Frictionless Timeline List
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    { id: '1', title: '', time: '', venue: '', dayNumber: 1 }
  ]);
  const [timelineVenueLinks, setTimelineVenueLinks] = useState<Record<string, string>>({});
  // Clock picker state
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null);
  const [pickerHour, setPickerHour] = useState(7);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [pickerAmPm, setPickerAmPm] = useState<'AM' | 'PM'>('PM');

  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const focusType = (() => {
    if (eventType === 'WEDDING' || eventType === 'ANNIVERSARY') return '2_PERSON';
    if (eventType === 'BIRTHDAY') return '1_PERSON';
    return 'GENERAL';
  })();

  const computedEndDate = calculateEndDate(startDate, durationDays);

  // Auto-generate Event Name beautifully in real-time
  const getAutoGeneratedEventName = () => {
    const celebrant = person1Name.trim();
    const partner = person2Name.trim();
    const host = person3Name.trim();

    if (eventType === 'WEDDING') {
      if (celebrant && partner) return `${celebrant} & ${partner}'s Wedding`;
      if (celebrant) return `${celebrant}'s Wedding Celebration`;
      return 'Royal Indian Wedding';
    }
    if (eventType === 'ANNIVERSARY') {
      if (celebrant && partner) return `${celebrant} & ${partner}'s Anniversary`;
      if (celebrant) return `${celebrant}'s Anniversary`;
      return 'Golden Anniversary Celebration';
    }
    if (eventType === 'BIRTHDAY') {
      if (celebrant) return `${celebrant}'s Birthday Celebration`;
      return 'Grand Birthday Party';
    }
    if (eventType === 'KITTY') {
      if (host) return `${host}'s Kitty Party`;
      return 'Exclusive Kitty Party';
    }
    if (host) return `${host}'s Celebration Event`;
    return 'Traditional Indian Celebration';
  };

  const autoEventName = getAutoGeneratedEventName();

  useEffect(() => {
    if (!isNameManuallyEdited) {
      setEventName(autoEventName);
    }
  }, [person1Name, person2Name, person3Name, eventType, autoEventName]);



  const handlePickStarPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      if (authToken) {
        setUploadingStar(true);
        try {
          // Resize and compress heavily to guarantee size remains well under 100KB
          const manipulated = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 450, height: 450 } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
          );

          const publicUrl = await uploadImage(authToken, manipulated.uri);
          setStarPhoto(publicUrl);
        } catch (e) {
          console.error(e);
          alert('Failed to upload photo. Using local preview.');
          setStarPhoto(result.assets[0].uri);
        } finally {
          setUploadingStar(false);
        }
      } else {
        setStarPhoto(result.assets[0].uri);
      }
    }
  };

  const handleReligionChange = (rel: 'HINDU' | 'SIKH' | 'MUSLIM' | 'CHRISTIAN' | 'OTHER') => {
    setReligion(rel);
    if (eventType === 'WEDDING') {
      if (RELIGION_THEMES[rel]?.[0]) {
        setCoverUrl(RELIGION_THEMES[rel][0]);
      }
    } else {
      setCoverUrl(DEFAULT_EVENT_PHOTOS[eventType] || DEFAULT_EVENT_PHOTOS.OTHER);
    }
  };

  const handleEventTypeChange = (type: 'WEDDING' | 'ANNIVERSARY' | 'BIRTHDAY' | 'KITTY' | 'OTHER') => {
    setEventType(type);
    if (type === 'WEDDING') {
      setCoverUrl(RELIGION_THEMES[religion]?.[0] || RELIGION_THEMES.HINDU[0]);
    } else {
      setCoverUrl(DEFAULT_EVENT_PHOTOS[type] || DEFAULT_EVENT_PHOTOS.OTHER);
    }
  };

  // Google Maps Search link auto generation
  const handleOpenMap = () => {
    const query = encodeURIComponent(venue || autoEventName || 'Indian Venue');
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    setLocationLink(mapUrl);
    Linking.openURL(mapUrl).catch((err) => console.warn('Could not launch maps app:', err));
  };

  // Paste direct clipboard string into locationLink
  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setLocationLink(text);
      } else {
        alert('Clipboard is empty. Please copy a link from Google Maps first.');
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Timeline list actions
  const handleGoToStep2 = () => {
    const updatedTimeline = [...timelineItems];
    if (updatedTimeline[0]) {
      if (!updatedTimeline[0].venue) {
        updatedTimeline[0].venue = venue;
      }
      if (locationLink && !timelineVenueLinks[updatedTimeline[0].id]) {
        setTimelineVenueLinks((prev) => ({
          ...prev,
          [updatedTimeline[0].id]: locationLink
        }));
      }
    }
    setTimelineItems(updatedTimeline);
    setStep(2);
  };

  const handleAddTimelineItem = () => {
    setTimelineItems([
      ...timelineItems,
      { id: Date.now().toString(), title: '', time: '', venue: venue || '', dayNumber: 1 }
    ]);
  };

  const handleRemoveTimelineItem = (id: string) => {
    if (timelineItems.length === 1) return;
    setTimelineItems(timelineItems.filter((x) => x.id !== id));
    const newLinks = { ...timelineVenueLinks };
    delete newLinks[id];
    setTimelineVenueLinks(newLinks);
  };

  const handleUpdateTimelineField = (id: string, field: keyof TimelineItem, val: any) => {
    setTimelineItems(
      timelineItems.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSetTimelineVenueLink = (id: string, link: string) => {
    setTimelineVenueLinks((prev) => ({ ...prev, [id]: link }));
  };

  const handleOpenMapForTimeline = (id: string, venueName: string) => {
    const query = encodeURIComponent(venueName || venue || 'Venue');
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    handleSetTimelineVenueLink(id, mapUrl);
    Linking.openURL(mapUrl).catch(() => {});
  };

  const handlePasteTimelineLink = async (id: string) => {
    try {
      const text = await Clipboard.getString();
      if (text) handleSetTimelineVenueLink(id, text);
      else alert('Clipboard is empty. Copy a Google Maps link first.');
    } catch (err) {
      console.warn('Clipboard error:', err);
    }
  };

  // Commit the clock picker selection to the timeline item
  const commitTimePicker = () => {
    if (!activeTimePicker) return;
    const h = pickerHour;
    const m = String(pickerMinute).padStart(2, '0');
    const timeStr = `${h}:${m} ${pickerAmPm}`;
    handleUpdateTimelineField(activeTimePicker, 'time', timeStr);
    setActiveTimePicker(null);
  };

  const handleSelectTagSuggestion = (tag: string) => {
    const updated = [...timelineItems];
    const lastIndex = updated.length - 1;
    updated[lastIndex] = {
      ...updated[lastIndex],
      title: tag,
      time: lastIndex === 0 ? '10:00 AM' : lastIndex === 1 ? '04:00 PM' : '07:00 PM',
      venue: venue || 'Main Spot',
    };
    setTimelineItems(updated);
  };

  const handleCreateEvent = async () => {
    if (!authToken) {
      alert('Authentication error. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const keyPeopleJson = JSON.stringify({
        focusType,
        starPhoto,
        religion,
        person1: person1Name ? { name: person1Name, phone: person1Phone } : null,
        person2: person2Name ? { name: person2Name, phone: person2Phone } : null,
        host: person3Name ? { name: person3Name, phone: person3Phone } : null,
      });

      // Format dynamic timeline program records
      const timelineArr = timelineItems
        .filter((x) => x.title.trim())
        .map((x) => {
          const mapLink = timelineVenueLinks[x.id] || '';
          return {
            title: x.title,
            time: x.time || '12:00 PM',
            venue: x.venue + (mapLink ? ` (${mapLink})` : ''),
            period: x.dayNumber > 1 ? `DAY_${x.dayNumber}` : 'GENERAL',
            dressCode: x.dressCode || '',
            mealOptions: x.mealOptions || '',
          };
        });

      const finalSpaceName = eventName.trim() || autoEventName;

      const response = await createSpace(authToken, {
        name: finalSpaceName,
        theme: welcomeMessage,
        coverUrl,
        date: startDate,
        endDate: computedEndDate,
        eventType,
        venue: venue + (locationLink ? ` (${locationLink})` : ''),
        locationLink,
        keyPeople: keyPeopleJson,
        timeline: timelineArr,
      });

      if (response?.inviteCode) {
        setInviteCode(response.inviteCode);
      } else {
        setInviteCode(finalSpaceName.slice(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase());
      }

      setStep(3);
    } catch (error: any) {
      console.error('Failed to create space:', error);
      alert('Failed to launch celebration space. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌟 You are cordially invited to celebrate "${autoEventName}"! 🌟\n\n📅 Date: ${startDate}\n📍 Venue: ${venue || 'TBA'}\n🗺️ Location: ${locationLink || 'Will be shared soon'}\n\n👉 Join the event space on GetMewed using Code: ${inviteCode}\n✨ Celebrate with us in real-time! ✨`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const renderCalendar = (onSelectDate: (d: string) => void, onClose: () => void) => {
    const days = getDaysInMonth(calYear, calMonth);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const changeMonth = (dir: number) => {
      let nextMonth = calMonth + dir;
      let nextYear = calYear;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      } else if (nextMonth < 0) {
        nextMonth = 11;
        nextYear--;
      }
      setCalMonth(nextMonth);
      setCalYear(nextYear);
    };

    return (
      <View style={styles.calendarInline}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Feather name="chevron-left" size={20} color="#D4AF37" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {monthNames[calMonth]} {calYear}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Feather name="chevron-right" size={20} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {days.map((dateObj, idx) => {
            const dayNum = dateObj.getDate();
            const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.calendarDayCell}
                onPress={() => {
                  onSelectDate(formatted);
                  onClose();
                }}
              >
                <Text style={styles.calendarDayText}>{dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: coverUrl }} style={styles.bgImage}>
        <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 24) }]}>
          
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={step === 1 ? onBack : () => setStep(step - 1)}>
              <Feather name="arrow-left" size={24} color="#D4AF37" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <BlinkingStars />
              <Text style={styles.headerTitle}>
                {step === 3 ? 'Live Space!' : `Step ${step} of 2`}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {step < 3 && (
            <View style={styles.stepperContainer}>
              <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
              <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
            </View>
          )}

          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: Combined Host Info, Religion & Dates */}
            {step === 1 && (
              <View style={styles.stepCard}>
                <Text style={styles.cardTitle}>Event Onboarding</Text>
                
                <Text style={styles.label}>EVENT TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                  {(['WEDDING', 'BIRTHDAY', 'ANNIVERSARY', 'KITTY', 'OTHER'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBadge, eventType === type && styles.typeBadgeActive]}
                      onPress={() => handleEventTypeChange(type)}
                    >
                      <Text style={[styles.typeBadgeText, eventType === type && styles.typeBadgeTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Religion selector */}
                <Text style={styles.label}>RELIGION / CULTURAL OPTION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                  {(['HINDU', 'SIKH', 'MUSLIM', 'CHRISTIAN', 'OTHER'] as const).map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[styles.religionBadge, religion === rel && styles.religionBadgeActive]}
                      onPress={() => handleReligionChange(rel)}
                    >
                      <Text style={[styles.religionBadgeText, religion === rel && styles.religionBadgeTextActive]}>
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Editable Event Name Title */}
                <Text style={styles.label}>EVENT SPACE TITLE</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Aarav & Diya's Grand Wedding"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={eventName}
                    onChangeText={(val) => {
                      setEventName(val);
                      setIsNameManuallyEdited(true);
                    }}
                  />
                </View>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: -6, marginBottom: 12 }}>
                  💡 Suggested: {autoEventName}
                </Text>

                {/* Celebrant/Couple Profile Photo Picker */}
                <Text style={styles.label}>UPLOAD CELEBRANT/COUPLE PHOTO</Text>
                <TouchableOpacity style={styles.profilePhotoPicker} onPress={handlePickStarPhoto} disabled={uploadingStar}>
                  {uploadingStar ? (
                    <View style={styles.profilePhotoPlaceholder}>
                      <ActivityIndicator color="#D4AF37" style={{ marginBottom: 8 }} />
                      <Text style={styles.profilePhotoText}>Uploading to Supabase...</Text>
                    </View>
                  ) : starPhoto ? (
                    <Image source={{ uri: starPhoto }} style={styles.profilePhotoPreview} />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <Feather name="camera" size={24} color="#D4AF37" />
                      <Text style={styles.profilePhotoText}>Tap to Upload Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Aligned Focus Details */}
                {focusType === '2_PERSON' && (
                  <View style={styles.alignedInputsContainer}>
                    <View style={styles.vipBlock}>
                      <Text style={styles.label}>
                        {eventType === 'WEDDING' ? 'BRIDE NAME' : 'PARTNER 1 NAME'}
                      </Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Full Name"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={person1Name}
                          onChangeText={setPerson1Name}
                        />
                      </View>
                      
                      <Text style={styles.label}>BRIDE CONTACT NUMBER</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Phone number"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          keyboardType="phone-pad"
                          value={person1Phone}
                          onChangeText={(val) => setPerson1Phone(val.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                    </View>

                    <View style={[styles.vipBlock, { borderTopWidth: 1.5, borderColor: 'rgba(212,175,55,0.15)', paddingTop: 16, marginTop: 8 }]}>
                      <Text style={styles.label}>
                        {eventType === 'WEDDING' ? 'GROOM NAME' : 'PARTNER 2 NAME'}
                      </Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Full Name"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          value={person2Name}
                          onChangeText={setPerson2Name}
                        />
                      </View>

                      <Text style={styles.label}>GROOM CONTACT NUMBER</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Phone number"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          keyboardType="phone-pad"
                          value={person2Phone}
                          onChangeText={(val) => setPerson2Phone(val.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {focusType === '1_PERSON' && (
                  <View style={styles.alignedInputsContainer}>
                    <Text style={styles.label}>CELEBRANT STAR NAME</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Aarav"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={person1Name}
                        onChangeText={setPerson1Name}
                      />
                    </View>

                    <Text style={styles.label}>STAR PHONE NUMBER</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="phone-pad"
                        value={person1Phone}
                        onChangeText={(val) => setPerson1Phone(val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>
                )}

                {focusType === 'GENERAL' && (
                  <View style={styles.alignedInputsContainer}>
                    <Text style={styles.label}>EVENT HOST / ORGANIZER NAME</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={person3Name}
                        onChangeText={setPerson3Name}
                      />
                    </View>

                    <Text style={styles.label}>HOST CONTACT NUMBER</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="phone-pad"
                        value={person3Phone}
                        onChangeText={(val) => setPerson3Phone(val.replace(/[^0-9]/g, ''))}
                      />
                    </View>
                  </View>
                )}

                {/* Date & Smart Duration picker */}
                <View style={styles.row}>
                  <View style={{ flex: 1.2, marginRight: 10 }}>
                    <Text style={styles.label}>START DATE</Text>
                    <TouchableOpacity 
                      style={styles.pickerTrigger} 
                      onPress={() => setShowStartCalendar(!showStartCalendar)}
                    >
                      <Text style={styles.pickerTriggerText}>{startDate || 'Select Date'}</Text>
                      <Feather name="calendar" size={16} color="#D4AF37" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>DURATION</Text>
                    <View style={styles.segmentedContainer}>
                      {([1, 2, 3, 4] as const).map((daysVal) => (
                        <TouchableOpacity
                          key={daysVal}
                          style={[styles.segmentBtn, durationDays === daysVal && styles.segmentBtnActive]}
                          onPress={() => setDurationDays(daysVal)}
                        >
                          <Text style={[styles.segmentBtnText, durationDays === daysVal && styles.segmentBtnTextActive]}>
                            {daysVal}D
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {showStartCalendar && renderCalendar(
                  (d) => setStartDate(d),
                  () => setShowStartCalendar(false)
                )}

                <Text style={styles.label}>VENUE / VENUE NAME</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Radisson Blu Palace, Udaipur"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={venue}
                    onChangeText={setVenue}
                  />
                </View>

                {/* Google Maps Actions */}
                <View style={[styles.row, { gap: 8, marginBottom: 12 }]}>
                  <TouchableOpacity style={[styles.mapsBtn, { flex: 1 }]} onPress={handleOpenMap}>
                    <Feather name="map-pin" size={14} color="#1A0F0A" />
                    <Text style={styles.mapsBtnText}>Search on Maps</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.pasteBtn, { flex: 1 }]} onPress={handlePasteClipboard}>
                    <Feather name="clipboard" size={14} color="#D4AF37" />
                    <Text style={styles.pasteBtnText}>Paste Copied Link</Text>
                  </TouchableOpacity>
                </View>

                {locationLink ? (
                  <View style={styles.locationLinkBadge}>
                    <Feather name="check" size={12} color="#00FF00" style={{ marginRight: 6 }} />
                    <Text numberOfLines={1} style={styles.locationLinkBadgeText}>
                      Saved: {locationLink}
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.label}>WELCOME GREETING MESSAGE</Text>
                <View style={[styles.inputWrapper, { height: 80 }]}>
                  <TextInput
                    style={[styles.input, { height: '100%', textAlignVertical: 'top', paddingTop: 10 }]}
                    multiline
                    numberOfLines={3}
                    placeholder="Write a custom welcome note..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={welcomeMessage}
                    onChangeText={setWelcomeMessage}
                  />
                </View>


                <TouchableOpacity 
                  style={[styles.nextBtn, (!person1Name && !person3Name) && styles.btnDisabled]} 
                  disabled={!person1Name && !person3Name}
                  onPress={handleGoToStep2}
                >
                  <Text style={styles.nextBtnText}>Continue to Timeline</Text>
                  <Feather name="arrow-right" size={20} color="#1A0F0A" />
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Frictionless Dynamic Timeline Program List */}
            {step === 2 && (
              <View style={styles.stepCard}>
                <Text style={styles.cardTitle}>Event Timeline</Text>
                <Text style={styles.cardSubtitle}>
                  Add program events. Tag suggestions can pre-fill details in one tap!
                </Text>

                {/* Popular Tags */}
                <Text style={styles.label}>TAP POPULAR PROGRAMS SUGGESTIONS</Text>
                <View style={styles.tagSuggestionContainer}>
                  {(PROGRAM_SUGGESTIONS[eventType] || PROGRAM_SUGGESTIONS.OTHER).map((tag, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.tagSuggestion}
                      onPress={() => handleSelectTagSuggestion(tag)}
                    >
                      <Text style={styles.tagSuggestionText}>+ {tag}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Dynamic Program Row Listing */}
                {timelineItems.map((item, index) => {
                  const isPickingTime = activeTimePicker === item.id;
                  const savedLink = timelineVenueLinks[item.id] || '';
                  return (
                  <View key={item.id} style={styles.dynamicTimeSection}>
                    <View style={styles.dynamicTimeSectionHeader}>
                      <Text style={styles.timeSectionTitle}>📍 Program #{index + 1}</Text>
                      {timelineItems.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveTimelineItem(item.id)}>
                          <Feather name="trash-2" size={16} color="#FF6347" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Program Title */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Sangeet / Maata Ki Chowki"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={item.title}
                        onChangeText={(val) => handleUpdateTimelineField(item.id, 'title', val)}
                      />
                    </View>

                    {/* ─── Clock Picker ─── */}
                    <Text style={styles.label}>TIME</Text>
                    <TouchableOpacity
                      style={styles.timePickerTrigger}
                      onPress={() => {
                        if (isPickingTime) { setActiveTimePicker(null); }
                        else {
                          setActiveTimePicker(item.id);
                          // Pre-fill from existing value
                          if (item.time) {
                            const parts = item.time.split(' ');
                            const hm = parts[0].split(':');
                            setPickerHour(parseInt(hm[0]) || 7);
                            setPickerMinute(parseInt(hm[1]) || 0);
                            setPickerAmPm((parts[1] as 'AM' | 'PM') || 'PM');
                          }
                        }
                      }}
                    >
                      <Feather name="clock" size={15} color="#D4AF37" />
                      <Text style={styles.timePickerTriggerText}>
                        {item.time || 'Set Time'}
                      </Text>
                      <Feather name={isPickingTime ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    {isPickingTime && (
                      <View style={styles.clockPicker}>
                        {/* Hour row */}
                        <Text style={styles.clockLabel}>HOUR</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => (
                              <TouchableOpacity
                                key={h}
                                style={[styles.clockCell, pickerHour === h && styles.clockCellActive]}
                                onPress={() => setPickerHour(h)}
                              >
                                <Text style={[styles.clockCellText, pickerHour === h && styles.clockCellTextActive]}>{h}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>

                        {/* Minute row */}
                        <Text style={styles.clockLabel}>MINUTE</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            {[0,5,10,15,20,25,30,35,40,45,50,55].map((m) => (
                              <TouchableOpacity
                                key={m}
                                style={[styles.clockCell, pickerMinute === m && styles.clockCellActive]}
                                onPress={() => setPickerMinute(m)}
                              >
                                <Text style={[styles.clockCellText, pickerMinute === m && styles.clockCellTextActive]}>{String(m).padStart(2,'0')}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ScrollView>

                        {/* AM / PM */}
                        <Text style={styles.clockLabel}>AM / PM</Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                          {(['AM', 'PM'] as const).map((ap) => (
                            <TouchableOpacity
                              key={ap}
                              style={[styles.clockCell, { flex: 1 }, pickerAmPm === ap && styles.clockCellActive]}
                              onPress={() => setPickerAmPm(ap)}
                            >
                              <Text style={[styles.clockCellText, pickerAmPm === ap && styles.clockCellTextActive]}>{ap}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Confirm */}
                        <TouchableOpacity style={styles.clockConfirmBtn} onPress={commitTimePicker}>
                          <Feather name="check" size={14} color="#1A0F0A" />
                          <Text style={styles.clockConfirmBtnText}>
                            Set {pickerHour}:{String(pickerMinute).padStart(2,'0')} {pickerAmPm}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ─── Venue: Name + Map link buttons ─── */}
                    <Text style={styles.label}>VENUE NAME</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Garden Lawn / Banquet Hall A"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={item.venue}
                        onChangeText={(val) => handleUpdateTimelineField(item.id, 'venue', val)}
                      />
                    </View>

                    <Text style={styles.label}>GOOGLE MAPS LINK</Text>
                    <View style={[styles.row, { gap: 8, marginBottom: 8 }]}>
                      <TouchableOpacity
                        style={[styles.mapsBtn, { flex: 1 }]}
                        onPress={() => handleOpenMapForTimeline(item.id, item.venue)}
                      >
                        <Feather name="map-pin" size={13} color="#1A0F0A" />
                        <Text style={styles.mapsBtnText}>Search Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pasteBtn, { flex: 1 }]}
                        onPress={() => handlePasteTimelineLink(item.id)}
                      >
                        <Feather name="clipboard" size={13} color="#D4AF37" />
                        <Text style={styles.pasteBtnText}>Paste Link</Text>
                      </TouchableOpacity>
                    </View>
                    {savedLink ? (
                      <View style={styles.locationLinkBadge}>
                        <Feather name="check" size={11} color="#00DD88" style={{ marginRight: 5 }} />
                        <Text numberOfLines={1} style={styles.locationLinkBadgeText}>Saved: {savedLink}</Text>
                      </View>
                    ) : null}

                    {/* Day Number Selector */}
                    {durationDays > 1 && (
                      <View style={styles.daySelectorRow}>
                        <Text style={styles.daySelectorLabel}>ASSIGN TO DAY:</Text>
                        <View style={styles.daySegmentContainer}>
                          {Array.from({ length: durationDays }).map((_, idx) => {
                            const dNum = idx + 1;
                            return (
                              <TouchableOpacity
                                key={dNum}
                                style={[styles.daySegmentBtn, item.dayNumber === dNum && styles.daySegmentBtnActive]}
                                onPress={() => handleUpdateTimelineField(item.id, 'dayNumber', dNum)}
                              >
                                <Text style={[styles.daySegmentBtnText, item.dayNumber === dNum && styles.daySegmentBtnTextActive]}>
                                  Day {dNum}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Program Specific Dress Code */}
                    <Text style={styles.label}>DRESS CODE (OPTIONAL)</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Royal Yellow / Traditional Ethnic"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={item.dressCode || ''}
                        onChangeText={(val) => handleUpdateTimelineField(item.id, 'dressCode', val)}
                      />
                    </View>

                    {/* Program Specific Menu Options */}
                    <Text style={styles.label}>MENU / MEAL OPTIONS (OPTIONAL)</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. North Indian, South Indian, Snacks, High Tea"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={item.mealOptions || ''}
                        onChangeText={(val) => handleUpdateTimelineField(item.id, 'mealOptions', val)}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {['North Indian', 'South Indian', 'Continental', 'Snacks', 'Cocktails', 'Pure Veg'].map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            borderRadius: 10,
                            backgroundColor: 'rgba(212,175,55,0.08)',
                            borderWidth: 1,
                            borderColor: 'rgba(212,175,55,0.2)',
                          }}
                          onPress={() => {
                            const current = (item.mealOptions || '').trim();
                            if (!current) {
                              handleUpdateTimelineField(item.id, 'mealOptions', tag);
                            } else if (!current.includes(tag)) {
                              handleUpdateTimelineField(item.id, 'mealOptions', current + `, ${tag}`);
                            }
                          }}
                        >
                          <Text style={{ fontSize: 10, color: '#D4AF37', fontWeight: '500' }}>+ {tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  );
                })}

                {/* Add Row Button */}
                <TouchableOpacity style={styles.addProgramBtn} onPress={handleAddTimelineItem}>
                  <Feather name="plus-circle" size={16} color="#D4AF37" />
                  <Text style={styles.addProgramBtnText}>Add Another Program Event</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.nextBtn, loading && styles.btnDisabled]} 
                  disabled={loading}
                  onPress={handleCreateEvent}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A0F0A" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>Launch Celebration</Text>
                      <Feather name="award" size={20} color="#1A0F0A" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: Success Share view */}
            {step === 3 && (
              <View style={styles.successCard}>
                <View style={styles.successBadge}>
                  <Feather name="check-circle" size={48} color="#D4AF37" />
                  <Text style={styles.successTitle}>Celebration Live!</Text>
                  <Text style={styles.successSub}>Guests can now join & upload photos in real-time</Text>
                </View>

                <ImageBackground source={{ uri: coverUrl }} style={styles.previewCard} imageStyle={{ borderRadius: 16 }}>
                  <View style={styles.previewOverlay}>
                    <View style={styles.previewHeader}>
                      <Text style={styles.previewTypeTag}>{eventType}</Text>
                      <Text style={styles.previewInviteCode}>Code: {inviteCode}</Text>
                    </View>
                    
                    <View>
                      <Text style={styles.previewName}>{autoEventName}</Text>
                      <View style={styles.previewDetailsRow}>
                        <Feather name="calendar" size={14} color="#E5C05C" />
                        <Text style={styles.previewDate}> {startDate} {computedEndDate && `to ${computedEndDate}`}</Text>
                      </View>
                      {venue ? (
                        <View style={[styles.previewDetailsRow, { marginTop: 4 }]}>
                          <Feather name="map-pin" size={14} color="#E5C05C" />
                          <Text style={styles.previewVenue}> {venue}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </ImageBackground>

                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Feather name="share-2" size={22} color="#1A0F0A" />
                  <Text style={styles.shareBtnText}>Share Invitation Link</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.doneBtn} 
                  onPress={() => {
                    onEventCreated({
                      id: inviteCode,
                      name: autoEventName,
                      theme: welcomeMessage,
                      coverUrl,
                      inviteCode,
                      date: startDate,
                    });
                  }}
                >
                  <Text style={styles.doneBtnText}>Go to Event Space</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0502',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 2, 0.85)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 60,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginVertical: 12,
  },
  stepBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
  },
  stepBarActive: {
    backgroundColor: '#E5C05C',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepCard: {
    backgroundColor: 'rgba(26, 15, 10, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 12,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  typeBadgeActive: {
    backgroundColor: '#E5C05C',
    borderColor: '#E5C05C',
  },
  typeBadgeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadgeTextActive: {
    color: '#1A0F0A',
  },
  religionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    marginRight: 8,
  },
  religionBadgeActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  religionBadgeText: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  religionBadgeTextActive: {
    color: '#1A0F0A',
  },
  generatedNameContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginVertical: 12,
  },
  generatedNameLabel: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  generatedNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pickerTriggerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    height: 52,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#E5C05C',
  },
  segmentBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#1A0F0A',
  },
  calendarInline: {
    backgroundColor: '#1E140F',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonthText: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarDayCell: {
    width: (width - 120) / 7,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  calendarDayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profilePhotoPicker: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  profilePhotoPreview: {
    width: '100%',
    height: '100%',
  },
  profilePhotoPlaceholder: {
    alignItems: 'center',
  },
  profilePhotoText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  alignedInputsContainer: {
    gap: 8,
  },
  vipBlock: {
    width: '100%',
  },
  mapsBtn: {
    flexDirection: 'row',
    backgroundColor: '#E5C05C',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mapsBtnText: {
    color: '#1A0F0A',
    fontSize: 13,
    fontWeight: '700',
  },
  pasteBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pasteBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
  },
  locationLinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    marginBottom: 16,
  },
  locationLinkBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  tagSuggestionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagSuggestion: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  tagSuggestionText: {
    color: '#E5C05C',
    fontSize: 11,
    fontWeight: '700',
  },
  dynamicTimeSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  dynamicTimeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  daySelectorRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  daySelectorLabel: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  daySegmentContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  daySegmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  daySegmentBtnActive: {
    backgroundColor: '#E5C05C',
    borderColor: '#E5C05C',
  },
  daySegmentBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '700',
  },
  daySegmentBtnTextActive: {
    color: '#1A0F0A',
  },
  addProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D4AF37',
    marginBottom: 16,
  },
  addProgramBtnText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
  },
  // Clock picker styles
  timePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
  },
  timePickerTriggerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  clockPicker: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
    padding: 14,
    marginBottom: 12,
  },
  clockLabel: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  clockCell: {
    minWidth: 42,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  clockCellActive: {
    backgroundColor: '#E5C05C',
    borderColor: '#E5C05C',
  },
  clockCellText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  clockCellTextActive: {
    color: '#1A0F0A',
  },
  clockConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E5C05C',
    borderRadius: 12,
    paddingVertical: 10,
  },
  clockConfirmBtnText: {
    color: '#1A0F0A',
    fontSize: 13,
    fontWeight: '800',
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: '#E5C05C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  nextBtnText: {
    color: '#1A0F0A',
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: 'rgba(139, 115, 61, 0.35)',
  },
  successCard: {
    backgroundColor: 'rgba(26, 15, 10, 0.9)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    padding: 24,
    alignItems: 'center',
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  successSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
  },
  previewCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTypeTag: {
    backgroundColor: '#E5C05C',
    color: '#1A0F0A',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  previewInviteCode: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  previewVenue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  shareBtn: {
    flexDirection: 'row',
    backgroundColor: '#E5C05C',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#1A0F0A',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  doneBtnText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
});
