package com.oneimpossiblethingatatime.slant;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SharedPicturesTest {
    @Test
    public void keepsGameNames() {
        assertEquals("slant-s07.png", SharedPictures.safeName("slant-s07.png"));
        assertEquals("slant-free-8x8.png", SharedPictures.safeName("slant-free-8x8.png"));
        assertEquals("slant-seed-123.png", SharedPictures.safeName("slant-seed-123.png"));
    }

    @Test
    public void refusesPathsAndOtherTypes() {
        assertEquals("slant.png", SharedPictures.safeName("../../x.png"));
        assertEquals("slant.png", SharedPictures.safeName(".hidden.png"));
        assertEquals("slant.png", SharedPictures.safeName("picture.html"));
        assertEquals("slant.png", SharedPictures.safeName(null));
        assertEquals("a-b.png", SharedPictures.safeName("a/b.png"));
    }

    @Test
    public void acceptsOnlyPng() {
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0};
        assertTrue(SharedPictures.isPng(png));
        assertFalse(SharedPictures.isPng(new byte[] {'<', 'h', 't', 'm', 'l', '>', 0, 0, 0}));
        assertFalse(SharedPictures.isPng(new byte[0]));
        assertFalse(SharedPictures.isPng(null));
    }
}
